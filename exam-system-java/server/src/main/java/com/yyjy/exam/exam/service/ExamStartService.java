package com.yyjy.exam.exam.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.Fetchers;
import com.yyjy.exam.entity.Immutables;
import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.entity.*;
import com.yyjy.exam.entity.id.NanoIdGenerator;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperExamSettings;
import com.yyjy.exam.entity.user.entity.UserStatus;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import com.yyjy.exam.paper.repository.PaperRepository;
import com.yyjy.exam.user.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 考试入口（**考生侧**）：开考 / 续考 / 次数上限。
 * <p>
 * 从原来的单体服务拆出来（拆分前它一个类管考生作答 + 判分 + 控制台读取，已经滚到 851 行）。
 * 本类只回答「谁能开始考、要不要续考、还能考几次」；判分在 {@link ExamGradingService}，
 * 控制台读取在 {@link ExamRecordQueryService}。
 */
@RequiredArgsConstructor
@Service
public class ExamStartService {

	private final ExamRecordsRepository examRecordsRepo;
	private final PaperRepository paperRepository;
	private final UsersRepository usersRepo;

	@Transactional
	public String startExam(long paperId, String studentName) {
		// ---- 1. 校验试卷本身 ----
		Long userId = null;
		String name = studentName;
		
		var paper = paperRepository.findById(paperId, Fetchers.PAPER_FETCHER.allScalarFields().examSettings(Fetchers.PAPER_EXAM_SETTINGS_FETCHER.allScalarFields()))
				            .orElseThrow(() -> new BusinessException("paper: 试卷不存在"));
		if (!paper.published()) {
			throw new BusinessException("paper: 试卷未发布");
		}
		var settings = paper.examSettings();
		if (settings == null) {
			throw new BusinessException("paper: 试卷考试设置缺失");
		}
		
		// ---- 2. 校验考试时间窗口（当前时间必须落在 [start, end] 内）----
		// `end` 是**整场结束**，到点后所有人都不能再考，
		// 手里那条 ONGOING 记录也不放行；`duration` 只是单场作答时长上限。
		var now = LocalDateTime.now();
		if (now.isBefore(settings.start())) {
			throw new BusinessException(MessageConstant.EXAM_NOT_STARTED);
		}
		if (now.isAfter(settings.end())) {
			throw new BusinessException("exam: 考试已结束");
		}
		
		// ---- 3. 解析身份 + 续考 / 次数校验 ----
		switch (paper.participateMode()) {
			case LOGIN_REQUIRED -> {
				if (!StpUtil.isLogin()) {
					throw new BusinessException(MessageConstant.EXAM_LOGIN_REQUIRED);
				}
				userId = StpUtil.getLoginIdAsLong();
				// 姓名一律取账号里的，不信任请求体（否则登录考生能冒名顶替）
				name = requireActiveRealName(userId);
				
				// 上次开考还没交卷 → 续考：不新建记录，也就不再占一次次数
				ExamRecords ongoing = examRecordsRepo.findOngoingByPaperIdAndUserId(paperId, userId);
				if (ongoing != null) {
					return resume(ongoing, settings, now);
				}
				
				// 校验考试次数：按 user_id 计（登录考生的 id 是确定的，改 studentName 绕不过去）
				if (examRecordsRepo.countByPaperIdAndUserId(paperId, userId) >= settings.maxAttempts()) {
					throw new BusinessException(MessageConstant.EXAM_ATTEMPT_LIMIT_REACHED
							                            + "（上限 " + settings.maxAttempts() + " 次）");
				}
			}
			case ANONYMOUS -> {
				// 姓名是这张记录唯一的身份来源（NOT NULL 列），空值直接挡在这里，别让它变成 500
				if (name == null || name.isBlank()) {
					throw new BusinessException("exam: 未提供考生姓名");
				}
				name = name.trim();
				
				// 同上，先看有没有进行中的记录 → 有就续考（否则接着校验次数）
				ExamRecords ongoing = examRecordsRepo.findOngoingByPaperIdAndStudentName(paperId, name);
				if (ongoing != null) {
					return resume(ongoing, settings, now);
				}
				
				// 校验姓名的考试次数（口径：同名共用额度、换个名字就能换额度，均按用户要求忽略）
				if (examRecordsRepo.countByPaperIdAndStudentName(paperId, name) >= settings.maxAttempts()) {
					throw new BusinessException(MessageConstant.EXAM_ATTEMPT_LIMIT_REACHED
							                            + "（上限 " + settings.maxAttempts() + " 次）");
				}
			}
			// 枚举以后加值也走不到「静默当匿名处理」这条路
			default -> throw new BusinessException("paper: 不支持的考生参与方式");
		}
		
		// ---- 4. 创建考试记录 ----
		// （now 在上面校验时间窗口时已取好，这里复用）
		final Long finalUserId = userId;
		final String finalName = name;
		ExamRecords saved = examRecordsRepo.save(Immutables.createExamRecords(draft -> {
			draft.setPaperId(paperId);
			if (finalUserId != null) {
				draft.setUserId(finalUserId);
			}
			draft.setPublicId(NanoIdGenerator.next());
			draft.setStudentName(finalName);
			draft.setStartTime(now);
			draft.setCreateTime(now);
			draft.setWindowSwitches(0);
			draft.setStatus(ExamRecordStatus.ONGOING);
		}), SaveMode.INSERT_ONLY);
		
		var paperTable = Tables.PAPER_TABLE;
		// 更新试卷的 score_count
		paperRepository.sql().createUpdate(paperTable)
				.where(Tables.PAPER_TABLE.id().eq(paperId))
				.set(paperTable.scoreCount(), paperTable.scoreCount().plus(1))
				.execute();
		return saved.publicId();
	}

	/**
	 * 续考：把上次那条还没交卷的记录还给前端继续作答。
	 * <p>
	 * **先看这场自己有没有超时** —— `end` 没到不代表作答时长还没用完：
	 * 超了就抛异常，不能让考生接着答（ExamTimeoutScheduler 随后会把它强制交卷）。
	 */
	private String resume(ExamRecords ongoing, PaperExamSettings settings, LocalDateTime now) {
		if (ongoing.startTime() != null
				    && now.isAfter(ongoing.startTime().plusMinutes(settings.duration()))) {
			throw new BusinessException(MessageConstant.EXAM_ATTEMPT_TIMEOUT);
		}
		return ongoing.publicId();
	}

	/**
	 * 「账号登录考试」的考生姓名：取账号里的 `realName`，**不信任请求体**。
	 * <p>
	 * 顺带把关：用户必须存在（含未被软删）且状态为 {@link UserStatus#ACTIVE}。
	 */
	private String requireActiveRealName(long userId) {
		var user = usersRepo.findById(userId)
				           .orElseThrow(() -> new BusinessException(MessageConstant.USER_NOT_FOUND));
		if (!UserStatus.ACTIVE.equals(user.status())) {
			throw new BusinessException(MessageConstant.USER_STATUS_ABNORMAL);
		}
		return user.realName();
	}
}
