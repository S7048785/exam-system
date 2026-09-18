package com.yyjy.exam.exam.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.config.RabbitMQConfig;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.Fetchers;
import com.yyjy.exam.entity.Immutables;
import com.yyjy.exam.entity.exam.dto.ExamRecordDetail;
import com.yyjy.exam.entity.exam.dto.ExamTakingView;
import com.yyjy.exam.entity.exam.entity.*;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.ParticipateMode;
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
	
	/**
	 * 批改取数图谱：题目 type / score / 标准答案。
	 * 派生查询 findByExamRecordId 只带回关联对象的 id，不带图谱直接访问 question().type() 会抛 UnloadedException。
	 */
	private static final Fetcher<AnswerRecord> ANSWER_RECORD_GRADING =
			Fetchers.ANSWER_RECORD_FETCHER
					.userAnswer()
					.question(
							Fetchers.QUESTIONS_FETCHER
									.type()
									.score()
									.questionAnswers(Fetchers.QUESTION_ANSWERS_FETCHER.answer()));
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
		
		// ---- 2. 校验试卷状态和时间窗口 ----
		var paperEntity = sqlClient.findById(Paper.class, paperId);
		if (paperEntity == null || !paperEntity.published()) {
			throw new BusinessException("试卷不存在或未发布");
		}
		var now = LocalDateTime.now();
		if (paperEntity.end().isBefore(now)) {
			throw new BusinessException("考试已结束");
		}
		
		// ---- 3. 参与方式校验（paper.participate_mode）----
		// 放在身份解析之后：匿名且没填姓名时先报「未登录且未提供考生姓名」，
		// 填了姓名但这份试卷要求登录时报这一条 —— 两条都是「你必须登录」的意思。
		if (paperEntity.participateMode() == ParticipateMode.LOGIN_REQUIRED && userId == null) {
			throw new BusinessException(MessageConstant.EXAM_LOGIN_REQUIRED);
		}
		
		// ---- 4. 次数校验（paper.max_attempts，默认 1 次）----
		// 口径由用户指定：按**考生名**计数。所有状态都计（含中途放弃的 ONGOING），软删除的记录不计。
		// 已知代价：登录用户换个 studentName 就能绕过；两个同名的人会共用这份额度。
		if (examRecordsRepo.countByPaperIdAndStudentName(paperId, name) >= paperEntity.maxAttempts()) {
			throw new BusinessException(MessageConstant.EXAM_ATTEMPT_LIMIT_REACHED
					                            + "（上限 " + paperEntity.maxAttempts() + " 次）");
		}
		
		// ---- 5. 创建考试记录 ----
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
		ExamRecords record = findRecordOrThrow(id);
		assertOwned(record);
		
		ExamTakingView view = sqlClient.findById(ExamTakingView.class, id);
		if (view == null) {
			throw new BusinessException("考试记录不存在");
		}
		return view;
	}
	
	/**
	 * 获取考试详情（含答题记录、评分、AI 批注；用于成绩展示页）
	 * 访问时触发请求时超时检测
	 * <p>
	 * 多用户改造：① 校验归属；② **考试还在进行中（ONGOING）时不返回详情**
	 * —— 返回类型 `ExamRecordDetail` 含 `questionChoices.correct` 与 `questionAnswers.answer`（整套答案），
	 * 不挡的话考生开考后立刻调本接口就能拿答案。
	 */
	public ExamRecordDetail getExamDetail(int id) {
		ExamRecords record = findRecordOrThrow(id);
		assertOwned(record);
		checkAndHandleTimeout(record);
		
		if (record.status() == ExamRecordStatus.ONGOING) {
			throw new BusinessException(MessageConstant.EXAM_DETAIL_NOT_AVAILABLE_ONGOING);
		}
		
		return sqlClient.findById(ExamRecordDetail.class, id);
	}
	
	/**
	 * 手动保存答案（upsert）：答题过程中允许考生随时保存
	 * 已存在的记录按 questionId 更新，不存在的插入
	 */
	public void saveAnswers(int examRecordId, List<SubmitAnswerReq> answers) {
		ExamRecords record = findRecordOrThrow(examRecordId);
		assertOwned(record);
		
		if (record.status() != ExamRecordStatus.ONGOING) {
			throw new BusinessException("考试已结束，无法保存答案");
		}
		
		// 构建现有答案的索引：questionId → AnswerRecord
		var existingAnswers = answerRecordRepo.findByExamRecordId(examRecordId);
		var answerMap = new HashMap<Long, AnswerRecord>();
		for (AnswerRecord ar : existingAnswers) {
			answerMap.put(ar.questionId(), ar);
		}
		// 先更新已存在的答案记录
		var updateAnswers = new ArrayList<AnswerRecord>();
		for (SubmitAnswerReq answer : answers) {
			if (answerMap.containsKey(answer.questionId())) {
				AnswerRecord existing = answerMap.get(answer.questionId());
				updateAnswers.add(Immutables.createAnswerRecord(existing, draft -> draft.setUserAnswer(answer.userAnswer())));
			} else {
				updateAnswers.add(Immutables.createAnswerRecord(draft -> draft.setScore(null).setUserAnswer(answer.userAnswer())
						                                                         .setExamRecordId(examRecordId)
						                                                         .setQuestionId(answer.questionId())));
			}
			
		}
		answerRecordRepo.saveEntities(updateAnswers, SaveMode.UPSERT);
	}
	
	/**
	 * 提交考试并进入评分流程（**本身不落库答案**，答案由 POST /exams/{examRecordId}/answers 先保存）：
	 * 1. 选择题/判断题 → 同步即时批改
	 * 2. 有简答题 → 状态置为 GRADING，触发异步 AI 批改
	 * 3. 无简答题 → 状态直接置为 GRADED
	 */
	@Transactional
	public void submitAnswers(int examRecordId, List<SubmitAnswerReq> answers) {
		ExamRecords record = findRecordOrThrow(examRecordId);
		assertOwned(record);
		
		if (record.status() != ExamRecordStatus.ONGOING) {
			throw new BusinessException("考试已提交");
		}
		// 提交前先检查是否超时
		checkAndHandleTimeout(record);
		
		// 答案不在这里落库：调用方必须先用 POST /exams/{examRecordId}/answers 保存好，
		// 本接口只负责「按已保存的答案批改 + 切状态」，answers 形参仅为保持接口契约。
		
		// 同步批改非简答题
		gradeNonTextQuestions(examRecordId);
		
		// 判断是否有简答题需要异步 AI 批改
		boolean hasTextQuestions = answerRecordRepo.findByExamRecordId(examRecordId, ANSWER_RECORD_GRADING).stream()
				                           .anyMatch(ar -> QuestionType.TEXT.equals(ar.question().type()));
		
		finishGrading(examRecordId, hasTextQuestions);
	}
	
	/**
	 * 批改收尾（submitAnswers 与 handleTimeoutSubmit 两条路径共用）：
	 * 客观题总分已由 gradeNonTextQuestions 写进 exam_records，这里只切状态 ——
	 * 不含简答题 → 直接 GRADED；含简答题 → GRADING 并投递异步 AI 批改，
	 * 简答分出来后由 ExamGradingQueueConsumer 累加到客观题小计上再置 GRADED。
	 */
	private void finishGrading(int examRecordId, boolean hasTextQuestions) {
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId);
			draft.setEndTime(LocalDateTime.now());
			draft.setStatus(hasTextQuestions ? ExamRecordStatus.GRADING : ExamRecordStatus.GRADED);
		}), SaveMode.UPDATE_ONLY);
		if (hasTextQuestions) {
			sendGradingMessage(examRecordId);
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
		boolean hasTextQuestions = answerRecordRepo.findByExamRecordId(examRecordId, ANSWER_RECORD_GRADING).stream()
				                           .anyMatch(ar -> QuestionType.TEXT.equals(ar.question().type()));
		finishGrading(examRecordId, hasTextQuestions);
	}
	
	/**
	 * 同步批改选择题和判断题（不处理简答题），结果**一次性批量写回**
	 */
	private void gradeNonTextQuestions(int examRecordId) {
		List<AnswerRecord> answerRecords = answerRecordRepo.findByExamRecordId(examRecordId, ANSWER_RECORD_GRADING);
		// 先纯计算，把要写的结果攒成 draft，最后一次性批量落库
		List<AnswerRecord> graded = new ArrayList<>();
		int totalScore = 0;
		for (AnswerRecord ar : answerRecords) {
			var type = ar.question().type();
			Integer score = null;
			if (QuestionType.SINGLE_CHOICE.equals(type) || QuestionType.MULTIPLE_CHOICE.equals(type)) {
				score = computeChoiceScore(ar);
			} else if (QuestionType.JUDGE.equals(type)) {
				score = computeJudgeScore(ar);
			}
			if (score == null) {
				// 简答题等非选择题，交给异步 AI 批改，这里不碰
				continue;
			}
			totalScore += score;
			final int s = score;
			graded.add(AnswerRecordDraft.$.produce(draft -> {
				draft.setId(ar.id());
				draft.setScore(s);
				draft.setCorrect(s > 0 ? 1 : 0);
			}));
		}
		if (!graded.isEmpty()) {
			answerRecordRepo.saveEntities(graded, SaveMode.UPDATE_ONLY);
		}
		// 客观题（选择/判断）的总分**直接写进 exam_records**；
		// 简答题的分数等异步 AI 批改完成后由 ExamGradingQueueConsumer 再累加上去
		final int objectiveScore = totalScore;
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId);
			draft.setScore(objectiveScore);
		}), SaveMode.UPDATE_ONLY);
	}
	
	/**
	 * 选择题评分（纯计算，不落库；写回由 gradeNonTextQuestions 批量做）：
	 * 多选题 → 选项集合完全一致才得分（顺序无关）
	 * 单选题 → 字符串精确匹配（忽略大小写）
	 */
	private int computeChoiceScore(AnswerRecord ar) {
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
		
		return userScore;
	}
	
	/**
	 * 判断题评分（纯计算，不落库）：忽略大小写比较
	 */
	private int computeJudgeScore(AnswerRecord ar) {
		String correctAnswer = ar.question().questionAnswers() != null
				                       ? Objects.requireNonNull(ar.question().questionAnswers()).answer() : null;
		return ar.userAnswer().equalsIgnoreCase(correctAnswer) ? ar.question().score() : 0;
	}
	
	/**
	 * 考试记录归属校验（多用户改造，决策台账 Q5 的收口形态）。
	 * <ul>
	 *   <li>记录的 `user_id` 为 <b>NULL</b> —— 匿名开考产生的记录，无主 → **放行**。
	 *       匿名考生的正常流程（开考 / 存答案 / 交卷 / 看题 / 看成绩）都靠这条放行。</li>
	 *   <li>记录有主 → **必须已登录且就是本人**，否则拒绝。未登录也算拒绝。</li>
	 * </ul>
	 * 这样既不影响匿名考试，又堵掉「未登录也能改别人答卷」与「登录用户碰别人记录」两条路。
	 * <p>
	 * ⚠️ 注意：单靠归属校验挡不住「注册用户开考后读自己那条记录的答案」——
	 * 那条额外的防线在 `getExamDetail` 的 `status == ONGOING` 门里。
	 */
	private void assertOwned(ExamRecords record) {
		Long ownerId = record.userId();
		if (ownerId == null) {
			return;
		}
		
		long me;
		try {
			me = StpUtil.getLoginIdAsLong();
		} catch (Exception e) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
		if (ownerId != me) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
	}
	
	/**
	 * 通用查找，不存在时抛异常
	 */
	private ExamRecords findRecordOrThrow(int id) {
		return examRecordsRepo.findById(id)
				       .orElseThrow(() -> new BusinessException("考试记录不存在"));
	}
}
