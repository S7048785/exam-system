package com.yyjy.exam.exam.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.config.RabbitMQConfig;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.exam.dto.ExamRecordDetail;
import com.yyjy.exam.entity.exam.dto.ExamTakingView;
import com.yyjy.exam.entity.exam.entity.*;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.exam.repository.AnswerRecordRepository;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import com.yyjy.exam.user.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@RequiredArgsConstructor
@Service
public class ExamRecordService {
	
	private final ExamRecordsRepository examRecordsRepo;
	private final AnswerRecordRepository answerRecordRepo;
	private final UsersRepository usersRepo;
	private final RabbitTemplate rabbitTemplate;
	private final JSqlClient sqlClient;
	
	/**
	 * 开始考试：支持登录用户和匿名用户两种模式
	 * 登录用户自动从 Sa-Token 获取 userId 和姓名；
	 * 匿名用户需提供 studentName (为将来免登录考试预留)
	 */
	@Transactional
	public int startExam(int paperId, String studentName) {
		// ---- 1. 确定用户身份 ----
		Long userId = null;
		String name = studentName;
		try {
			// 优先从 Sa-Token 获取已登录用户
			userId = StpUtil.getLoginIdAsLong();
			if (name == null || name.isBlank()) {
				// 未提供姓名时从用户表取 realName
				name = usersRepo.findById(userId)
						       .map(Users::realName)
						       .orElseThrow(() -> new BusinessException("用户不存在"));
			}
		} catch (Exception e) {
			// 未登录时必须提供 studentName
			if (name == null || name.isBlank()) {
				throw new BusinessException("未登录且未提供考生姓名");
			}
		}
		
		// ---- 2. 重复考试校验 ----
		if (userId != null) {
			ExamRecords existing = examRecordsRepo.findByPaperIdAndUserId(paperId, userId);
			if (existing != null) {
				throw new BusinessException("您已参加过该考试");
			}
		}
		
		// ---- 3. 校验试卷状态和时间窗口 ----
		var paperEntity = sqlClient.findById(Paper.class, paperId);
		if (paperEntity == null || !paperEntity.published()) {
			throw new BusinessException("试卷不存在或未发布");
		}
		var now = LocalDateTime.now();
		if (paperEntity.end().isBefore(now)) {
			throw new BusinessException("考试已结束");
		}
		
		// ---- 4. 创建考试记录 ----
		final Long finalUserId = userId;
		final String finalName = name;
		ExamRecords saved = examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setPaperId(paperId);
			if (finalUserId != null) {
				draft.setUserId(finalUserId);
			}
			draft.setStudentName(finalName);
			draft.setStartTime(now);
			draft.setCreateTime(now);
			draft.setWindowSwitches(0);
			draft.setStatus(ExamRecordStatus.ONGOING);
		}), SaveMode.INSERT_ONLY);
		return saved.id();
	}
	
	/**
	 * 获取答题页数据（不含正确答案，仅用于考试中展示题目）
	 */
	public ExamTakingView getExamTaking(int id) {
		ExamTakingView view = sqlClient.findById(ExamTakingView.class, id);
		if (view == null) {
			throw new BusinessException("考试记录不存在");
		}
		return view;
	}
	
	/**
	 * 获取考试详情（含答题记录、评分、AI 批注；用于成绩展示页）
	 * 访问时触发请求时超时检测
	 */
	public ExamRecordDetail getExamDetail(int id) {
		ExamRecords record = findRecordOrThrow(id);
		checkAndHandleTimeout(record);
		
		return sqlClient.findById(ExamRecordDetail.class, id);
	}
	
	/**
	 * 手动保存答案（upsert）：答题过程中允许考生随时保存
	 * 已存在的记录按 questionId 更新，不存在的插入
	 */
	@Transactional
	public void saveAnswers(int examRecordId, List<SubmitAnswerReq> answers) {
		ExamRecords record = findRecordOrThrow(examRecordId);
		if (record.status() != ExamRecordStatus.ONGOING) {
			throw new BusinessException("考试已结束，无法保存答案");
		}
		
		// 构建现有答案的索引：questionId → AnswerRecord
		var existingAnswers = answerRecordRepo.findByExamRecordId(examRecordId);
		var answerMap = new HashMap<Long, AnswerRecord>();
		for (AnswerRecord ar : existingAnswers) {
			answerMap.put(ar.questionId(), ar);
		}
		
		// 逐题 upsert
		for (SubmitAnswerReq answer : answers) {
			final AnswerRecord existing = answerMap.get((long) answer.questionId());
			final SubmitAnswerReq cur = answer;
			// 新增答案记录
			answerRecordRepo.save(AnswerRecordDraft.$.produce(draft -> {
				if (existing != null) {
					draft.setId(existing.id());
				}
				draft.setExamRecordId(examRecordId);
				draft.setQuestionId(cur.questionId());
				draft.setUserAnswer(cur.userAnswer());
			}), SaveMode.UPSERT);
		}
	}
	
	/**
	 * 提交答案并进入评分流程：
	 * 1. 选择题/判断题 → 同步即时批改
	 * 2. 有简答题 → 状态置为 GRADING，触发异步 AI 批改
	 * 3. 无简答题 → 状态直接置为 GRADED
	 */
	@Transactional
	public void submitAnswers(int examRecordId, List<SubmitAnswerReq> answers) {
		ExamRecords record = findRecordOrThrow(examRecordId);
		if (record.status() != ExamRecordStatus.ONGOING) {
			throw new BusinessException("考试已提交");
		}
		// 提交前先检查是否超时
		checkAndHandleTimeout(record);
		
		// 保存所有提交的答案
		for (SubmitAnswerReq answer : answers) {
			final SubmitAnswerReq cur = answer;
			answerRecordRepo.save(AnswerRecordDraft.$.produce(draft -> {
				draft.setExamRecordId(examRecordId);
				draft.setQuestionId(cur.questionId());
				draft.setUserAnswer(cur.userAnswer());
			}));
		}
		
		// 同步批改非简答题
		gradeNonTextQuestions(examRecordId);
		
		// 判断是否有简答题需要异步 AI 批改
		boolean hasTextQuestions = answerRecordRepo.findByExamRecordId(examRecordId).stream()
				                           .anyMatch(ar -> QuestionType.TEXT.equals(ar.question().type()));
		
		var nowTime = LocalDateTime.now();
		if (hasTextQuestions) {
			examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
				draft.setId(examRecordId);
				draft.setEndTime(nowTime);
				draft.setStatus(ExamRecordStatus.GRADING);
			}), SaveMode.UPDATE_ONLY);
			sendGradingMessage(examRecordId);
		} else {
			examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
				draft.setId(examRecordId);
				draft.setEndTime(nowTime);
				draft.setStatus(ExamRecordStatus.GRADED);
			}), SaveMode.UPDATE_ONLY);
		}
	}
	
	/**
	 * 发送阅卷消息到 RabbitMQ
	 */
	private void sendGradingMessage(int examRecordId) {
		try {
			rabbitTemplate.convertAndSend(
					RabbitMQConfig.GRADING_EXCHANGE,
					RabbitMQConfig.GRADING_ROUTING_KEY,
					String.valueOf(examRecordId)
			);
		} catch (Exception e) {
			log.error("发送阅卷消息失败, examRecordId: {}", examRecordId, e);
		}
	}
	
	/**
	 * 获取当前登录用户的考试记录列表（按创建时间倒序）
	 */
	public List<ExamRecords> getExamHistory(Fetcher<ExamRecords> fetcher) {
		long userId = StpUtil.getLoginIdAsLong();
		return examRecordsRepo.findByUserId(userId, fetcher);
	}
	
	/**
	 * 请求时超时检测：若考试已超时则自动提交（主要防线）
	 * 对比 startTime + duration 与当前时间
	 */
	private void checkAndHandleTimeout(ExamRecords record) {
		if (record.status() != ExamRecordStatus.ONGOING) return;
		if (record.startTime() == null) return;
		
		Paper paper = sqlClient.findById(Paper.class, record.paperId());
		if (paper == null) return;
		
		LocalDateTime deadline = record.startTime().plusMinutes(paper.duration());
		if (LocalDateTime.now().isAfter(deadline)) {
			examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
				draft.setId(record.id());
				draft.setEndTime(LocalDateTime.now());
			}), SaveMode.UPDATE_ONLY);
		}
	}
	
	/**
	 * 超时处理：批改客观题 + 更新状态 + 推送阅卷消息
	 */
	public void handleTimeoutSubmit(int examRecordId) {
		gradeNonTextQuestions(examRecordId);
		boolean hasTextQuestions = answerRecordRepo.findByExamRecordId(examRecordId).stream()
				                           .anyMatch(ar -> QuestionType.TEXT.equals(ar.question().type()));
		if (hasTextQuestions) {
			// 包含主观题，更新试卷状态再交给 AI 批改
			examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
				draft.setId(examRecordId);
				draft.setEndTime(LocalDateTime.now());
				draft.setStatus(ExamRecordStatus.GRADING);
			}), SaveMode.UPDATE_ONLY);
			sendGradingMessage(examRecordId);
		} else {
			examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
				draft.setId(examRecordId);
				draft.setEndTime(LocalDateTime.now());
				draft.setStatus(ExamRecordStatus.GRADED);
			}), SaveMode.UPDATE_ONLY);
		}
	}
	
	/**
	 * 同步批改选择题和判断题（不处理简答题）
	 */
	private void gradeNonTextQuestions(int examRecordId) {
		List<AnswerRecord> answerRecords = answerRecordRepo.findByExamRecordId(examRecordId);
		for (AnswerRecord ar : answerRecords) {
			var type = ar.question().type();
			if (QuestionType.SINGLE_CHOICE.equals(type) || QuestionType.MULTIPLE_CHOICE.equals(type)) {
				gradeChoiceQuestion(ar);
			} else if (QuestionType.JUDGE.equals(type)) {
				gradeJudgeQuestion(ar);
			}
		}
	}
	
	/**
	 * 选择题评分：
	 * 多选题 → 选项集合完全一致才得分（顺序无关）
	 * 单选题 → 字符串精确匹配（忽略大小写）
	 */
	private void gradeChoiceQuestion(AnswerRecord ar) {
		String userAnswer = ar.userAnswer();
		String correctAnswer = ar.question().questionAnswers() != null
				                       ? Objects.requireNonNull(ar.question().questionAnswers()).answer() : null;
		int userScore = 0;
		
		if (QuestionType.MULTIPLE_CHOICE.equals(ar.question().type())) {
			// 多选题：拆分为 Set 比较，不依赖选项顺序
			if (correctAnswer != null) {
				Set<String> userSet = new HashSet<>(List.of(userAnswer.split(",")));
				Set<String> correctSet = new HashSet<>(List.of(correctAnswer.split(",")));
				userScore = userSet.equals(correctSet) ? ar.question().score() : 0;
			}
		} else {
			// 单选题：精确匹配，容忍大小写差异
			if (userAnswer.equals(correctAnswer)) {
				userScore = ar.question().score();
			} else if (userAnswer.equalsIgnoreCase(correctAnswer)) {
				userScore = ar.question().score();
			}
		}
		
		final int score = userScore;
		answerRecordRepo.save(AnswerRecordDraft.$.produce(draft -> {
			draft.setId(ar.id());
			draft.setScore(score);
			draft.setCorrect(score > 0 ? 1 : 0);
		}));
	}
	
	/**
	 * 判断题评分：忽略大小写比较
	 */
	private void gradeJudgeQuestion(AnswerRecord ar) {
		String correctAnswer = ar.question().questionAnswers() != null
				                       ? Objects.requireNonNull(ar.question().questionAnswers()).answer() : null;
		final int s = ar.userAnswer().equalsIgnoreCase(correctAnswer) ? ar.question().score() : 0;
		answerRecordRepo.save(AnswerRecordDraft.$.produce(draft -> {
			draft.setId(ar.id());
			draft.setScore(s);
			draft.setCorrect(s > 0 ? 1 : 0);
		}));
	}
	
	/**
	 * 通用查找，不存在时抛异常
	 */
	private ExamRecords findRecordOrThrow(int id) {
		return examRecordsRepo.findById(id)
				       .orElseThrow(() -> new BusinessException("考试记录不存在"));
	}
}
