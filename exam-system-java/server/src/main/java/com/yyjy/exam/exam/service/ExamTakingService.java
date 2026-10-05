package com.yyjy.exam.exam.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.Immutables;
import com.yyjy.exam.entity.exam.dto.ExamRecordDetail;
import com.yyjy.exam.entity.exam.dto.ExamTakingView;
import com.yyjy.exam.entity.exam.entity.AnswerRecord;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.entity.ExamRecordsDraft;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.entity.exam.io.res.ExamPaperInfoRes;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperExamSettings;
import com.yyjy.exam.exam.repository.AnswerRecordRepository;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import com.yyjy.exam.paper.repository.PaperExamSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 考生作答链路：取答题页 / 保存答案 / 交卷 / 超时强制交卷，以及考生侧的详情、历史、入口信息。
 * <p>
 * 交卷与超时交卷都只是「校验 + 调 {@link ExamGradingService#autoGradeAndFinish}」——
 * 判分口径只有一份，本类不重复实现。
 */
@RequiredArgsConstructor
@Service
public class ExamTakingService {
	
	private final ExamRecordsRepository examRecordsRepo;
	private final AnswerRecordRepository answerRecordRepo;
	private final JSqlClient sqlClient;
	private final PaperExamSettingsRepository paperExamSettingsRepo;
	private final ExamRecordSupport support;
	private final ExamGradingService gradingService;
	
	/**
	 * 获取答题页数据（不含正确答案，仅用于考试中展示题目）
	 */
	public ExamTakingView getExamTaking(long id) {
		ExamRecords record = support.findRecordOrThrow(id);
		support.assertOwned(record);
		
		ExamTakingView view = sqlClient.findById(ExamTakingView.class, id);
		if (view == null) {
			throw new BusinessException("考试记录不存在");
		}
		return view;
	}
	
	/**
	 * 获取考试详情（含答题记录、评分、批注；用于成绩展示页）
	 * 访问时触发请求时超时检测
	 * <p>
	 * 多用户改造：① 校验归属；② **考试还在进行中（ONGOING）时不返回详情**
	 * —— 返回类型 `ExamRecordDetail` 含 `questionChoices.correct` 与 `questionAnswers.answer`（整套答案），
	 * 不挡的话考生开考后立刻调本接口就能拿答案。
	 */
	public ExamRecordDetail getExamDetail(long id) {
		ExamRecords record = support.findRecordOrThrow(id);
		support.assertOwned(record);
		checkAndHandleTimeout(record);
		
		if (record.status() == ExamRecordStatus.ONGOING) {
			throw new BusinessException(MessageConstant.EXAM_DETAIL_NOT_AVAILABLE_ONGOING);
		}
		
		return sqlClient.findById(ExamRecordDetail.class, id);
	}
	
	/**
	 * 获取当前登录用户的考试记录列表（按创建时间倒序）
	 */
	public List<ExamRecords> getExamHistory(Fetcher<ExamRecords> fetcher) {
		long userId = StpUtil.getLoginIdAsLong();
		return examRecordsRepo.findByUserId(userId, fetcher);
	}
	
	/**
	 * 考试入口页：按 paperId 取试卷信息（**考生侧，免登录可访问，不做归属校验**）。
	 * <p>
	 * 口径：
	 * - 试卷不存在、或**未发布** → 统一抛「考试不存在」（不区分两者，避免泄露未发布试卷的存在）；
	 * - 已发布但**已过截止时间** → 抛「考试已结束」；
	 * - 未开始 → 照常返回信息，由前端提示「未开始」并不放行。
	 */
	public ExamPaperInfoRes getPaperInfoForExaminee(long paperId) {
		Paper paper = sqlClient.findById(Paper.class, paperId);
		if (paper == null || !paper.published()) {
			throw new BusinessException("考试不存在");
		}
		PaperExamSettings settings = paperExamSettingsRepo.findByPaperId(paperId);
		if (settings == null) {
			throw new BusinessException("考试不存在");
		}
		if (settings.end().isBefore(LocalDateTime.now())) {
			throw new BusinessException("考试已结束");
		}
		return new ExamPaperInfoRes(
				paper.id(),
				paper.name(),
				paper.description(),
				settings.start(),
				settings.end(),
				paper.totalScore(),
				settings.duration(),
				paper.participateMode());
	}
	
	/**
	 * 手动保存答案（**全量覆盖**）：先删掉这场考试的旧答案，再按请求体整份重建。
	 * <p>
	 * 为什么「先删后插」：只做 upsert 的话，请求体里没有的题会保留旧答案 —— 考生把多选题的
	 * 选项全部取消勾选之后就再也改不回去了（旧答案会一直留着参与判分）。删掉重插则
	 * 「请求体里没有 = 这题没答」。
	 * <p>
	 * ⚠️ 因此请求体必须是**整份答卷**，不能只传改动的那几题，否则其余答案会被清空。
	 */
	@Transactional
	public void saveAnswers(long examRecordId, List<SubmitAnswerReq> answers) {
		ExamRecords record = support.findRecordOrThrow(examRecordId);
		support.assertOwned(record);
		
		if (record.status() != ExamRecordStatus.ONGOING) {
			throw new BusinessException("考试未开始，无法保存答案");
		}
		
		// 全量覆盖：先清空，再按请求体重建
		answerRecordRepo.deleteByExamRecordId(examRecordId);
		
		if (answers.isEmpty()) {
			return;
		}
		
		List<AnswerRecord> insertAnswers = new ArrayList<>(answers.size());
		for (SubmitAnswerReq answer : answers) {
			insertAnswers.add(Immutables.createAnswerRecord(draft -> draft
					                                                         .setScore(null)
					                                                         .setUserAnswer(answer.userAnswer())
					                                                         .setExamRecordId(examRecordId)
					                                                         .setQuestionId(answer.questionId())));
		}
		// 刚删干净，必然全是新增；表上有 uk_exam_record_question，请求体若有重复 questionId 会直接报错
		answerRecordRepo.saveEntities(insertAnswers, SaveMode.INSERT_ONLY);
	}
	
	/**
	 * 提交考试并进入评分流程（**本身不落库答案**，答案由 POST /exams/{examRecordId}/answers 先保存）：
	 * 1. 选择题/判断题 → 同步即时批改
	 * 2. 有简答题 → 状态置为 GRADING（**等待人工阅卷**）
	 * 3. 无简答题 → 状态直接置为 GRADED
	 */
	@Transactional
	public void submitAnswers(long examRecordId, List<SubmitAnswerReq> answers) {
		ExamRecords record = support.findRecordOrThrow(examRecordId);
		support.assertOwned(record);
		
		if (record.status() != ExamRecordStatus.ONGOING) {
			throw new BusinessException("考试已提交");
		}
		// 提交前先检查是否超时
		checkAndHandleTimeout(record);
		
		// 答案不在这里落库：调用方必须先用 POST /exams/{examRecordId}/answers 保存好，
		// 本接口只负责「按已保存的答案批改 + 切状态」，answers 形参仅为保持接口契约。
		
		// 批改客观题 + 按「还有没有简答题」收尾：逻辑收敛在 ExamGradingService，
		// 交卷（这里）与超时强制交卷两处入口共用同一份，别再各抄一遍
		gradingService.autoGradeAndFinish(examRecordId);
	}
	
	/**
	 * 请求时超时检测：若考试已超时则自动提交（主要防线）
	 * 对比 startTime + duration 与当前时间
	 */
	private void checkAndHandleTimeout(ExamRecords record) {
		if (record.status() != ExamRecordStatus.ONGOING) return;
		if (record.startTime() == null) return;
		
		PaperExamSettings settings = paperExamSettingsRepo.findByPaperId(record.paperId());
		if (settings == null) return;
		
		LocalDateTime deadline = record.startTime().plusMinutes(settings.duration());
		if (LocalDateTime.now().isAfter(deadline)) {
			examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
				draft.setId(record.id());
				draft.setEndTime(LocalDateTime.now());
			}), SaveMode.UPDATE_ONLY);
		}
	}
	
	/**
	 * 超时处理：批改客观题 + 更新状态（简答题留待人工批改）。
	 * <p>
	 * 必须带事务：这个方法里有两处写（批量写回答案分数 + 写 `exam_records` 的分数与状态），
	 * 不包事务的话中途失败会留「答案已判、记录还是 ONGOING」的半成品。
	 * <p>
	 * 粒度是**一场考试一个事务**：调用方 {@code ExamTimeoutScheduler} 是 `@Scheduled` 方法里的
	 * 普通 for 循环（本身不是事务方法），所以这里每调一次就新开一个事务，
	 * 不会把整批超时卷子裹进同一个事务里 —— 单场失败只回滚它自己。
	 */
	@Transactional
	public void handleTimeoutSubmit(long examRecordId) {
		gradingService.autoGradeAndFinish(examRecordId);
	}
}
