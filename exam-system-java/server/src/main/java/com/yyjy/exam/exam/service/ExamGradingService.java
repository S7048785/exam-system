package com.yyjy.exam.exam.service;

import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.Fetchers;
import com.yyjy.exam.entity.exam.entity.*;
import com.yyjy.exam.entity.exam.io.req.GradeAnswerReq;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.exam.repository.AnswerRecordRepository;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 考试评分服务
 * 判分：客观题自动判 + 简答题人工判卷，以及「满分口径」的唯一实现。
 */
@RequiredArgsConstructor
@Service
public class ExamGradingService {
	
	private static final Fetcher<AnswerRecord> ANSWER_RECORD_GRADING =
			Fetchers.ANSWER_RECORD_FETCHER
					.examRecordId()
					.userAnswer()
					.question(
							Fetchers.QUESTIONS_FETCHER
									.type()
									.score()
									.questionAnswers(Fetchers.QUESTION_ANSWERS_FETCHER.answer()));
	
	private final ExamRecordsRepository examRecordsRepo;
	private final AnswerRecordRepository answerRecordRepo;
	private final PaperQuestionRepository paperQuestionRepo;
	private final ExamRecordSupport support;
	
	/**
	 * 人工判卷（**批量**）：给这场考试的若干条答案打分，并重算 `score` / 推进 `status`
	 * 得分上界 = 该题在**这张卷上**的配分（`paper_question.score` 优先、回落 `questions.score`）；
	 * `correct` 与 `score` 各存各的（简答可以「判错但给部分分」）。
	 *
	 * @param publicId 考试记录对外短码（自增 id 只是数据库主键，不进接口）
	 */
	@Transactional
	public void gradeAnswers(String publicId, List<GradeAnswerReq> answers) {
		if (answers == null || answers.isEmpty()) {
			throw new BusinessException("exam: 判卷内容不能为空");
		}
		
		// ---- 1. 状态前置校验（只有待批改能判）+ 归属校验（只有试卷作者能判）----
		ExamRecords record = support.findRecordOrThrow(publicId);
		final long examRecordId = record.id();
		support.requireOwnedPaper(record.paperId());
		if (ExamRecordStatus.ONGOING.equals(record.status())) {
			throw new BusinessException("exam: 考试尚未交卷，不能判卷");
		}
		// ---- 2. 入参转 Map（answerRecordId → 本次判卷项）----
		Map<Long, GradeAnswerReq> gradeByAnswerId = new HashMap<>(answers.size());
		for (GradeAnswerReq item : answers) {
			// 请求体是 List，元素上的 @Valid 靠容器级联生效；这里兜一次空值，
			// 免得校验没级联上时变成 NPE 500（不是重复校验，是防框架细节）
			if (item == null || item.answerRecordId() == null || item.score() == null) {
				throw new BusinessException("exam: 判卷参数不完整");
			}
			gradeByAnswerId.put(item.answerRecordId(), item);
		}
		
		// ---- 3. 遍历该场考试的答案，比对后写回 ----
		List<AnswerRecord> answersInRecord = answerRecordRepo.findByExamRecordId(examRecordId, ANSWER_RECORD_GRADING);
		Map<Long, Integer> paperScores = paperQuestionRepo.findScoreMapByPaperId(record.paperId());
		List<AnswerRecord> graded = new ArrayList<>();
		for (AnswerRecord answer : answersInRecord) {
			GradeAnswerReq item = gradeByAnswerId.get(answer.id());
			if (item == null) {
				continue; // 这次不判这题，保持原样
			}
			int maxScore = scoreOf(answer, paperScores);
			if (item.score() > maxScore) {
				throw new BusinessException("exam: 得分不能超过该题满分（最多 " + maxScore + " 分）");
			}
			final int score = item.score();
			final int correct = Boolean.TRUE.equals(item.correct()) ? 1 : 0;
			graded.add(AnswerRecordDraft.$.produce(draft -> {
				draft.setId(answer.id());
				draft.setScore(score);
				draft.setCorrect(correct);
				draft.setUpdateTime(LocalDateTime.now());
			}));
		}
		if (graded.isEmpty()) {
			// 入参没有一个能对上这场的答案 ⇒ 什么都没变，不必空跑重算
			return;
		}
		answerRecordRepo.saveEntities(graded, SaveMode.UPDATE_ONLY);
		
		// ---- 4. 重算总分 + 推进状态 ----
		final int totalScore = answerRecordRepo.sumScoreByExamRecordId(examRecordId);
		final boolean stillUngraded = answerRecordRepo.countUngradedByExamRecordId(examRecordId) > 0;
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId);
			draft.setScore(totalScore);
			draft.setStatus(stillUngraded ? ExamRecordStatus.GRADING : ExamRecordStatus.GRADED);
			draft.setUpdateTime(LocalDateTime.now());
		}), SaveMode.UPDATE_ONLY);
	}
	
	/**
	 * 自动判分收尾（交卷与超时强制交卷的共用入口）：
	 * ① 客观题（选择/判断）即时判分并写回；② 看还有没有简答题；③ 写 endTime + 切状态
	 * （不含简答 → GRADED；含简答 → GRADING，等人工批改登分）。
	 */
	public void autoGradeAndFinish(long examRecordId) {
		gradeNonTextQuestions(examRecordId);
		boolean hasTextQuestions = answerRecordRepo.findByExamRecordId(examRecordId, ANSWER_RECORD_GRADING).stream()
				                           .anyMatch(ar -> QuestionType.TEXT.equals(ar.question().type()));
		finishGrading(examRecordId, hasTextQuestions);
	}
	
	/**
	 * 同步批改选择题和判断题（不处理简答题），结果一次性批量写回
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
				draft.setId(ar.id())
						.setScore(s)
						.setCorrect(s > 0 ? 1 : 0);
			}));
		}
		if (!graded.isEmpty()) {
			answerRecordRepo.saveEntities(graded, SaveMode.UPDATE_ONLY);
		}
		// 客观题（选择/判断）的总分**直接写进 exam_records**；
		// 简答题的分数等人工批改完成后由批改接口再累加上去
		final int objectiveScore = totalScore;
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId).setScore(objectiveScore);
		}), SaveMode.UPDATE_ONLY);
	}
	
	private void finishGrading(long examRecordId, boolean hasTextQuestions) {
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId);
			draft.setEndTime(LocalDateTime.now());
			draft.setStatus(hasTextQuestions ? ExamRecordStatus.GRADING : ExamRecordStatus.GRADED);
		}), SaveMode.UPDATE_ONLY);
	}
	
	/**
	 * 选择题评分（纯计算，不落库；写回由 gradeNonTextQuestions 批量做）：
	 * 多选题 → 选项集合完全一致才得分（顺序无关）
	 * 单选题 → 字符串精确匹配（忽略大小写）
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
	 */
	private int scoreOf(AnswerRecord ar, Map<Long, Integer> paperScores) {
		Integer paperScore = paperScores.get(ar.questionId());
		return paperScore != null ? paperScore : ar.question().score();
	}
}
