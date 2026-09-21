package com.yyjy.exam.exam.service;

import com.yyjy.exam.common.config.RabbitMQConfig;
import com.yyjy.exam.entity.Fetchers;
import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.entity.AnswerRecord;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.entity.ExamRecordsDraft;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.exam.repository.AnswerRecordRepository;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * RabbitMQ 消费者 — 异步阅卷
 * 监听 exam.grading.queue，收到 examRecordId 后调用 AI 批改简答题
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class ExamGradingQueueConsumer {
	
	private final ExamRecordsRepository examRecordsRepo;
	private final AnswerRecordRepository answerRecordRepo;
	private final PaperQuestionRepository paperQuestionRepo;
	private final ExamBulkGradingService examBulkGradingService;
	
	@RabbitListener(queues = RabbitMQConfig.GRADING_QUEUE)
	public void consumeGradingMessage(String examRecordIdStr) {
		int examRecordId = Integer.parseInt(examRecordIdStr);
		log.info("收到阅卷消息, 考试记录ID: {}", examRecordId);
		try {
			processGrading(examRecordId);
			log.info("异步阅卷完成, 考试记录ID: {}", examRecordId);
		} catch (Exception e) {
			log.error("异步阅卷失败, 考试记录ID: {}, 回退至 SUBMITTED", examRecordId, e);
			examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
				draft.setId(examRecordId);
				draft.setStatus(ExamRecordStatus.SUBMITTED);
			}), SaveMode.UPDATE_ONLY);
		}
	}
	
	private void processGrading(int examRecordId) {
		//List<AnswerRecord> answerRecords = answerRecordRepo.findByExamRecordId(examRecordId);
		var table = Tables.ANSWER_RECORD_TABLE;
		List<AnswerRecord> textAnswers = answerRecordRepo.sql().createQuery(table)
				                                 .where(table.examRecordId().eq(examRecordId))
				                                 .where(table.question().type().eq(QuestionType.TEXT))
				                                 .select(table.fetch(
						                                 Fetchers.ANSWER_RECORD_FETCHER.question(
								                                 // ⚠️ questionAnswers() 必须带 fetcher 才会加载 answer，
								                                 // 否则下面取标准答案时抛 UnloadedException（曾导致简答批改整条链路失效）
								                                 Fetchers.QUESTIONS_FETCHER.title()
										                                 .questionAnswers(Fetchers.QUESTION_ANSWERS_FETCHER.answer())
										                                 .score()
						                                 ).userAnswer()
				                                 ))
				                                 .execute();
		// 过滤出简答题
		//List<AnswerRecord> textAnswers = answerRecords.stream()
		//		                                 .filter(ar -> QuestionType.TEXT.equals(ar.question().type()))
		//		                                 .toList();
		
		// 满分口径与客观题一致：试卷配分(paper_question.score)优先，取不到才回落题目分值。
		// 简答题的满分要交给 AI 作为评分上限，读错了会直接给出与卷面总分不符的分数。
		Map<Long, Integer> paperScores = resolvePaperScores(examRecordId);
		
		// 调用 AI 批量批改
		if (!textAnswers.isEmpty()) {
			var requests = textAnswers.stream()
					               .map(ar -> new com.yyjy.exam.entity.exam.io.req.QuestionTextGradingReq(
							               ar.id(),
							               ar.question().title(),
							               Objects.requireNonNull(ar.question().questionAnswers()).answer(),
							               scoreOf(ar, paperScores),
							               ar.userAnswer()
					               ))
					               .toList();
			examBulkGradingService.batchGrading(requests);
		}
		
		// 简答分合计（刚由 AI 批改写回）
		int textScore = answerRecordRepo.sumTextScoreByExamRecordId(examRecordId);
		
		ExamRecords record = examRecordsRepo.findById(examRecordId).orElse(null);
		if (record == null) {
			log.warn("考试记录不存在，跳过简答分累加, 考试记录ID: {}", examRecordId);
			return;
		}
		// 只有还停在 GRADING 才累加：MQ 重投递时状态已是 GRADED，否则简答分会被加两遍
		if (record.status() != ExamRecordStatus.GRADING) {
			log.warn("考试记录 {} 当前状态为 {}，跳过简答分累加", examRecordId, record.status());
			return;
		}
		int objectiveScore = record.score() == null ? 0 : record.score();
		int totalScore = objectiveScore + textScore;
		log.info("累加简答分: 考试记录ID={}, 客观题小计={}, 简答分={}, 合计={}",
				examRecordId, objectiveScore, textScore, totalScore);
		
		// 成功 → GRADED
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId);
			draft.setScore(totalScore);
			draft.setStatus(ExamRecordStatus.GRADED);
		}), SaveMode.UPDATE_ONLY);
	}
	
	/**
	 * 某场考试所用试卷的「题目 → 配分」映射（`paper_question.score`）。
	 * 考试记录不存在时返回空表，调用方会回落到「题目分值」。
	 */
	private Map<Long, Integer> resolvePaperScores(int examRecordId) {
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
