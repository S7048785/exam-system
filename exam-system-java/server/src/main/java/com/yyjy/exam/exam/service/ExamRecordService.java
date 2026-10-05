package com.yyjy.exam.exam.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.convention.result.PageRes;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.Fetchers;
import com.yyjy.exam.entity.Immutables;
import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.dto.ExamRecordDetail;
import com.yyjy.exam.entity.exam.dto.ExamTakingView;
import com.yyjy.exam.entity.exam.entity.*;
import com.yyjy.exam.entity.exam.io.req.ExamRecordListQuery;
import com.yyjy.exam.entity.exam.io.req.ExamRecordStatsQuery;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.entity.exam.io.res.ExamPaperInfoRes;
import com.yyjy.exam.entity.exam.io.res.ExamRecordListItemRes;
import com.yyjy.exam.entity.exam.io.res.ExamRecordStatsRes;
import com.yyjy.exam.entity.id.NanoIdGenerator;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperExamSettings;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.entity.user.entity.UserStatus;
import com.yyjy.exam.exam.repository.AnswerRecordRepository;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import com.yyjy.exam.paper.repository.PaperExamSettingsRepository;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import com.yyjy.exam.paper.repository.PaperRepository;
import com.yyjy.exam.user.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.Predicate;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.ast.tuple.Tuple2;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@RequiredArgsConstructor
@Service
public class ExamRecordService {
	
	/**
	 * 批改取数图谱：题目 type / score / 标准答案。
	 * 派生查询 findByExamRecordId 只带回关联对象的 id，不带图谱直接访问 question().type() 会抛 UnloadedException。
	 * <p>
	 * ⚠️ 这里的 `score()`（questions.score）只是**回落值**：判分满分以 `paper_question.score`（试卷配分）
	 * 为准，仅当该题已不在试卷里时才用它 —— 见 {@link #scoreOf}。
	 */
	private static final Fetcher<AnswerRecord> ANSWER_RECORD_GRADING =
			Fetchers.ANSWER_RECORD_FETCHER
					.userAnswer()
					.question(
							Fetchers.QUESTIONS_FETCHER
									.type()
									.score()
									.questionAnswers(Fetchers.QUESTION_ANSWERS_FETCHER.answer()));
	/**
	 * 成绩列表取数图谱：只带列表要展示的标量列。
	 * 卷面总分（paper.total_score）与及格分（paper_exam_settings.passing_score）单独查，
	 * 避免为了两个标量去 join 两张表。
	 */
	private static final Fetcher<ExamRecords> RECORD_LIST_ITEM =
			Fetchers.EXAM_RECORDS_FETCHER
					.studentName()
					.score()
					.startTime()
					.endTime()
					.status();
	
	/**
	 * 成绩统计取数图谱：只要三个标量列（成绩 / 交卷时间 / 状态）就够算「展示成绩」。
	 */
	private static final Fetcher<ExamRecords> RECORD_STATS_ITEM =
			Fetchers.EXAM_RECORDS_FETCHER
					.score()
					.endTime()
					.status();
	private final ExamRecordsRepository examRecordsRepo;
	private final AnswerRecordRepository answerRecordRepo;
	private final PaperQuestionRepository paperQuestionRepo;
	private final PaperExamSettingsRepository paperExamSettingsRepo;
	private final UsersRepository usersRepo;
	private final JSqlClient sqlClient;
	private final PaperRepository paperRepository;
	
	/**
	 * 「这场的成绩还没定稿」：状态为 ONGOING、或没有交卷时间。
	 * <p>
	 * 两个条件都要判 —— 超时检测 {@code checkAndHandleTimeout} 只写 `endTime` 不改状态，
	 * 所以库里可能存在「状态 ONGOING 但已有 endTime」的记录，那条同样算没定稿。
	 */
	private static boolean isNotFinished(ExamRecords r) {
		return r.endTime() == null || ExamRecordStatus.ONGOING.equals(r.status());
	}
	
	/**
	 * 「展示成绩」口径的唯一实现 —— 列表与统计**共用**，两处永远不会漂移：
	 * 未定稿 ⇒ 0；否则取记录里的分数（NULL 按 0）。
	 */
	private static int displayScore(ExamRecords r) {
		return isNotFinished(r) ? 0 : (r.score() == null ? 0 : r.score());
	}
	
	@Transactional
	public long startExam(long paperId, String studentName) {
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
		return saved.id();
	}
	
	/**
	 * 续考：把上次那条还没交卷的记录还给前端继续作答。
	 * <p>
	 * **先看这场自己有没有超时** —— `end` 没到不代表作答时长还没用完：
	 * 超了就抛异常，不能让考生接着答（ExamTimeoutScheduler 随后会把它强制交卷）。
	 */
	private long resume(ExamRecords ongoing, PaperExamSettings settings, LocalDateTime now) {
		if (ongoing.startTime() != null
				    && now.isAfter(ongoing.startTime().plusMinutes(settings.duration()))) {
			throw new BusinessException(MessageConstant.EXAM_ATTEMPT_TIMEOUT);
		}
		return ongoing.id();
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
	
	/**
	 * 获取答题页数据（不含正确答案，仅用于考试中展示题目）
	 */
	public ExamTakingView getExamTaking(long id) {
		ExamRecords record = findRecordOrThrow(id);
		assertOwned(record);
		
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
		ExamRecords record = findRecordOrThrow(id);
		assertOwned(record);
		checkAndHandleTimeout(record);
		
		if (record.status() == ExamRecordStatus.ONGOING) {
			throw new BusinessException(MessageConstant.EXAM_DETAIL_NOT_AVAILABLE_ONGOING);
		}
		
		return sqlClient.findById(ExamRecordDetail.class, id);
	}
	
	/**
	 * 考生的答题详情（**控制台侧**：试卷作者查看本卷任意一条记录的作答，**只读**）。
	 */
	public ExamRecordDetail getRecordDetailForAuthor(long recordId) {
		ExamRecords record = findRecordOrThrow(recordId);
		long paperId = record.paperId();
		requireOwnedPaper(paperId);
		
		if (ExamRecordStatus.ONGOING.equals(record.status())) {
			throw new BusinessException(MessageConstant.EXAM_DETAIL_NOT_AVAILABLE_ONGOING);
		}
		ExamRecordDetail detail = sqlClient.findById(ExamRecordDetail.class, recordId);
		if (detail == null) {
			throw new BusinessException("考试记录不存在");
		}
		
		// 题目顺序：DTO 取数不带 ORDER BY，`paper_question` 也没有排序列 ⇒
		// 按「题目加进试卷的先后」重排一遍，题号才稳定；已从试卷移除的题排到最后。
		//List<Long> orderedIds = paperQuestionRepo.findOrderedQuestionIdsByPaperId(paperId);
		//List<ExamRecordDetail.TargetOf_paper.TargetOf_questions> questions =
		//		new ArrayList<>(detail.getPaper().getQuestions());
		//questions.sort(Comparator.comparingInt(
		//		(ExamRecordDetail.TargetOf_paper.TargetOf_questions q) -> {
		//			int index = orderedIds.indexOf(q.getId());
		//			return index < 0 ? Integer.MAX_VALUE : index;
		//		}));
		//detail.getPaper().setQuestions(questions);
		
		return detail;
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
		ExamRecords record = findRecordOrThrow(examRecordId);
		assertOwned(record);
		
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
		
		// 判断是否有简答题需要人工阅卷
		boolean hasTextQuestions = answerRecordRepo.findByExamRecordId(examRecordId, ANSWER_RECORD_GRADING).stream()
				                           .anyMatch(ar -> QuestionType.TEXT.equals(ar.question().type()));
		
		finishGrading(examRecordId, hasTextQuestions);
	}
	
	/**
	 * 批改收尾（submitAnswers 与 handleTimeoutSubmit 两条路径共用）：
	 * 客观题总分已由 gradeNonTextQuestions 写进 exam_records，这里只切状态 ——
	 * 不含简答题 → 直接 GRADED；含简答题 → GRADING（**等待人工阅卷**），
	 * 简答题分数由后续人工批改接口累加到客观题小计上后再置 GRADED。
	 */
	private void finishGrading(long examRecordId, boolean hasTextQuestions) {
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId);
			draft.setEndTime(LocalDateTime.now());
			draft.setStatus(hasTextQuestions ? ExamRecordStatus.GRADING : ExamRecordStatus.GRADED);
		}), SaveMode.UPDATE_ONLY);
	}
	
	/**
	 * 获取当前登录用户的考试记录列表（按创建时间倒序）
	 */
	public List<ExamRecords> getExamHistory(Fetcher<ExamRecords> fetcher) {
		long userId = StpUtil.getLoginIdAsLong();
		return examRecordsRepo.findByUserId(userId, fetcher);
	}
	
	/**
	 * 成绩列表（**控制台**：试卷作者查看本卷全部考试记录）。
	 * <p>
	 * 口径：
	 * <ul>
	 *   <li><b>归属</b>：先查试卷作者，非本人 → 422（与其他控制台接口一致）；</li>
	 *   <li><b>排序</b>：成绩降序，同分按 id 降序。未交卷的记录 `score` 为 NULL，
	 *       用 `coalesce(score, 0)` 参与排序 —— 与前端展示的「成绩 0」落在同一档，
	 *       且不依赖各数据库对 NULL 的默认排序；</li>
	 *   <li><b>名次</b>：顺序名次（1,2,3…，不并列）= 分页偏移 + 页内下标 + 1。
	 *       排序确定则名次确定，故不查库、不引窗口函数；</li>
	 *   <li><b>用时 / 成绩</b>：状态为 ONGOING 或没有交卷时间 ⇒ 0（见 {@link #toListItem}）。</li>
	 *   <li><b>筛选</b>：姓名（模糊）/ 状态 / 是否及格，三者都是「可空 = 不筛」，全部下推到 SQL
	 *       —— 所以<b>名次是筛选结果集内</b>的顺序名次（与姓名筛选同口径）。</li>
	 * </ul>
	 */
	public PageRes<ExamRecordListItemRes> listPaperRecords(ExamRecordListQuery query) {
		long paperId = query.paperId();
		
		// ---- 1. 归属校验 + 取卷面总分（一次查询两个标量）----
		int totalScore = requireOwnedPaper(paperId);
		
		// ---- 2. 及格分：设置行可能不存在（建卷不再预写），缺失按 0 ----
		PaperExamSettings settings = paperExamSettingsRepo.findByPaperId(paperId);
		int passingScore = settings == null ? 0 : settings.passingScore();
		
		// ---- 3. 分页查记录（成绩降序，同分按 id 降序）----
		int page = query.page();
		int size = query.size();
		ExamRecordsTable t = Tables.EXAM_RECORDS_TABLE;
		var q = examRecordsRepo.sql().createQuery(t)
				        .where(t.paperId().eq(paperId));
		String name = query.name();
		if (name != null && !name.isBlank()) {
			// like 默认 LikeMode.ANYWHERE（两侧 %），与试卷列表的名称搜索口径一致
			q.where(t.studentName().like(name.trim()));
		}
		if (query.status() != null) {
			q.where(t.status().eq(query.status()));
		}
		Boolean passed = query.passed();
		if (passed != null) {
			// 及格判据与表格展示、统计**同源**：`coalesce(score, 0)` 就是「展示成绩」——
			// 未交卷的记录 score 为 NULL，coalesce 成 0，自然落到「未及格」一侧。
			// 及格分 0 的卷里「未及格」会筛不到任何记录，这是数据本身决定的，不是 bug。
			var isPassed = t.score().coalesce(0).ge(passingScore);
			q.where(passed ? isPassed : Predicate.not(isPassed));
		}
		var res = q.orderBy(t.score().coalesce(0).desc(), t.id().desc())
				          .select(t.fetch(RECORD_LIST_ITEM))
				          .fetchPage(page - 1, size);
		
		// ---- 4. 组装返回：名次 = 全局位置 ----
		int offset = (page - 1) * size;
		List<ExamRecordListItemRes> list = new ArrayList<>(res.getRows().size());
		for (int i = 0; i < res.getRows().size(); i++) {
			list.add(toListItem(res.getRows().get(i), offset + i + 1, passingScore, totalScore));
		}
		return PageRes.<ExamRecordListItemRes>builder()
				       .page(page)
				       .pageSize(size)
				       .total(res.getTotalRowCount())
				       .list(list)
				       .build();
	}
	
	/**
	 * 组装成绩列表的一行。
	 * <p>
	 * 未交卷口径（用户拍板）：状态为 {@link ExamRecordStatus#ONGOING} <b>或</b> `endTime` 为空
	 * ⇒ 用时 0、成绩 0。两个条件都要判 —— 超时检测 {@code checkAndHandleTimeout} 只写 `endTime`
	 * 不改状态，所以库里可能存在「状态 ONGOING 但已有 endTime」的记录，那条按规则仍记 0。
	 */
	private ExamRecordListItemRes toListItem(ExamRecords r, int rank, int passingScore, int totalScore) {
		LocalDateTime start = r.startTime();
		LocalDateTime end = r.endTime();
		boolean notFinished = isNotFinished(r);
		
		long usedSeconds = 0L;
		if (!notFinished && start != null) {
			// 时钟回拨等极端情况下 end 可能早于 start，兜底不为负
			usedSeconds = Math.max(0L, Duration.between(start, end).getSeconds());
		}
		int score = displayScore(r);
		
		return new ExamRecordListItemRes(
				String.valueOf(r.id()),
				r.studentName(),
				start,
				end,
				usedSeconds,
				passingScore,
				totalScore,
				score,
				rank,
				r.status()
		);
	}
	
	/**
	 * 控制台侧归属校验：试卷必须存在且属于当前登录用户，否则 422
	 * （不存在 → `PAPER_NOT_FOUND`；非本人 → `NOT_YOUR_RESOURCE`）。
	 * <p>
	 * 返回卷面总分（一次查询顺手带回，别为它再查一遍）；成绩统计用不上返回值，
	 * 只借用这里的校验，故调用处可忽略。
	 */
	private int requireOwnedPaper(long paperId) {
		long me = StpUtil.getLoginIdAsLong();
		PaperTable paper = PaperTable.$;
		List<Tuple2<Long, Integer>> owners = examRecordsRepo.sql().createQuery(paper)
				                                     .where(paper.id().eq(paperId))
				                                     .select(paper.userId(), paper.totalScore())
				                                     .execute();
		if (owners.isEmpty()) {
			throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		}
		Tuple2<Long, Integer> owner = owners.getFirst();
		if (owner.get_1() != me) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
		return owner.get_2() == null ? 0 : owner.get_2();
	}
	
	/**
	 * 成绩统计（控制台：表格上方的汇总数字）。
	 * <p>
	 * 口径见 {@link ExamRecordStatsRes}：**整卷**（与列表的姓名筛选无关）、**全部记录都算**，
	 * 每条取 {@link #displayScore}（考试中 = 0、待批改 = 客观题小计）。
	 * 因此 `参与人数 == 及格次数 + 不及格次数` 恒成立。
	 * <p>
	 * 实现上把该卷记录的三个标量列读回来在内存里聚合：量级小（一场考试的考生数），
	 * 且能直接复用 {@link #displayScore} —— 与列表是**同一份口径代码**，不会两处漂移。
	 */
	public ExamRecordStatsRes getRecordStats(ExamRecordStatsQuery query) {
		long paperId = query.paperId();
		requireOwnedPaper(paperId);
		
		PaperExamSettings settings = paperExamSettingsRepo.findByPaperId(paperId);
		int passingScore = settings == null ? 0 : settings.passingScore();
		
		ExamRecordsTable t = Tables.EXAM_RECORDS_TABLE;
		List<ExamRecords> records = examRecordsRepo.sql().createQuery(t)
				                            .where(t.paperId().eq(paperId))
				                            .select(t.fetch(RECORD_STATS_ITEM))
				                            .execute();
		
		int participantCount = records.size();
		int passCount = 0;
		int maxScore = 0;
		int minScore = 0;
		long sum = 0L;
		for (int i = 0; i < participantCount; i++) {
			int score = displayScore(records.get(i));
			if (score >= passingScore) {
				passCount++;
			}
			if (i == 0 || score > maxScore) {
				maxScore = score;
			}
			if (i == 0 || score < minScore) {
				minScore = score;
			}
			sum += score;
		}
		// 平均分返回原始值，保留几位小数由展示层决定
		double avgScore = participantCount == 0 ? 0d : (double) sum / participantCount;
		
		return new ExamRecordStatsRes(
				participantCount,
				passCount,
				participantCount - passCount,
				maxScore,
				avgScore,
				minScore
		);
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
	 * 超时处理：批改客观题 + 更新状态（简答题留待人工批改）
	 */
	public void handleTimeoutSubmit(long examRecordId) {
		gradeNonTextQuestions(examRecordId);
		boolean hasTextQuestions = answerRecordRepo.findByExamRecordId(examRecordId, ANSWER_RECORD_GRADING).stream()
				                           .anyMatch(ar -> QuestionType.TEXT.equals(ar.question().type()));
		finishGrading(examRecordId, hasTextQuestions);
	}
	
	/**
	 * 同步批改选择题和判断题（不处理简答题），结果**一次性批量写回**
	 */
	private void gradeNonTextQuestions(long examRecordId) {
		List<AnswerRecord> answerRecords = answerRecordRepo.findByExamRecordId(examRecordId, ANSWER_RECORD_GRADING);
		// 分值口径：优先用「试卷配分」(paper_question.score)，取不到才回落「题目分值」(questions.score)。
		// 只查一次，避免逐题打库。
		Map<Long, Integer> paperScores = resolvePaperScores(examRecordId);
		// 先纯计算，把要写的结果攒成 draft，最后一次性批量落库
		List<AnswerRecord> graded = new ArrayList<>();
		int totalScore = 0;
		for (AnswerRecord ar : answerRecords) {
			var type = ar.question().type();
			Integer score = null;
			if (QuestionType.SINGLE_CHOICE.equals(type) || QuestionType.MULTIPLE_CHOICE.equals(type)) {
				score = computeChoiceScore(ar, scoreOf(ar, paperScores));
			} else if (QuestionType.JUDGE.equals(type)) {
				score = computeJudgeScore(ar, scoreOf(ar, paperScores));
			}
			if (score == null) {
				// 简答题等主观题不在此判分，留给人工阅卷
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
		// 简答题的分数等人工批改完成后由批改接口再累加上去
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
	 *
	 * @param fullScore 答对时的满分，由调用方按「试卷配分优先」的口径算好传入
	 */
	private int computeChoiceScore(AnswerRecord ar, int fullScore) {
		String userAnswer = ar.userAnswer();
		String correctAnswer = ar.question().questionAnswers() != null
				                       ? Objects.requireNonNull(ar.question().questionAnswers()).answer() : null;
		int userScore = 0;
		
		if (QuestionType.MULTIPLE_CHOICE.equals(ar.question().type())) {
			// 多选题：拆分为 Set 比较，不依赖选项顺序
			if (correctAnswer != null) {
				Set<String> userSet = new HashSet<>(List.of(userAnswer.split(",")));
				Set<String> correctSet = new HashSet<>(List.of(correctAnswer.split(",")));
				userScore = userSet.equals(correctSet) ? fullScore : 0;
			}
		} else {
			// 单选题：精确匹配，容忍大小写差异
			if (userAnswer.equals(correctAnswer)) {
				userScore = fullScore;
			} else if (userAnswer.equalsIgnoreCase(correctAnswer)) {
				userScore = fullScore;
			}
		}
		
		return userScore;
	}
	
	/**
	 * 判断题评分（纯计算，不落库）：忽略大小写比较
	 *
	 * @param fullScore 答对时的满分，由调用方按「试卷配分优先」的口径算好传入
	 */
	private int computeJudgeScore(AnswerRecord ar, int fullScore) {
		String correctAnswer = ar.question().questionAnswers() != null
				                       ? Objects.requireNonNull(ar.question().questionAnswers()).answer() : null;
		return ar.userAnswer().equalsIgnoreCase(correctAnswer) ? fullScore : 0;
	}
	
	/**
	 * 某场考试所用试卷的「题目 → 配分」映射（`paper_question.score`）。
	 * 考试记录不存在时返回空表，调用方会回落到「题目分值」。
	 */
	private Map<Long, Integer> resolvePaperScores(long examRecordId) {
		ExamRecords record = examRecordsRepo.findById(examRecordId).orElse(null);
		if (record == null) {
			return Map.of();
		}
		return paperQuestionRepo.findScoreMapByPaperId(record.paperId());
	}
	
	/**
	 * 取某道题在本场考试里的**满分**：试卷配分优先，查不到（例如题已从试卷移除）才用题目自带分值。
	 * <p>
	 * 🔴 这张卷的 `paper.total_score` 是按 `paper_question.score` 累加的，
	 * 判分若读 `questions.score`，会给出一道与卷面总分对不上的分数 —— 故以配分为准。
	 */
	private int scoreOf(AnswerRecord ar, Map<Long, Integer> paperScores) {
		Integer paperScore = paperScores.get(ar.questionId());
		return paperScore != null ? paperScore : ar.question().score();
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
	private ExamRecords findRecordOrThrow(long id) {
		return examRecordsRepo.findById(id)
				       .orElseThrow(() -> new BusinessException("考试记录不存在"));
	}
}
