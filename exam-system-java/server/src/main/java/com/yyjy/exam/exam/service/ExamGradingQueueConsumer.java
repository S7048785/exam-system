package com.yyjy.exam.exam.service;

import com.yyjy.exam.common.config.RabbitMQConfig;
import com.yyjy.exam.entity.exam.entity.AnswerRecord;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecordsDraft;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.exam.repository.AnswerRecordRepository;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;
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
		List<AnswerRecord> answerRecords = answerRecordRepo.findByExamRecordId(examRecordId);
		
		// 过滤出简答题
		List<AnswerRecord> textAnswers = answerRecords.stream()
				                                 .filter(ar -> QuestionType.TEXT.equals(ar.question().type()))
				                                 .toList();
		
		// 调用 AI 批量批改
		if (!textAnswers.isEmpty()) {
			var requests = textAnswers.stream()
					               .map(ar -> new com.yyjy.exam.entity.exam.io.req.QuestionTextGradingReq(
							               ar.id(),
							               ar.question().title(),
							               Objects.requireNonNull(ar.question().questionAnswers()).answer(),
							               ar.question().score(),
							               ar.userAnswer()
					               ))
					               .toList();
			examBulkGradingService.batchGrading(requests);
		}
		
		// 累加总分
		int totalScore = answerRecordRepo.findByExamRecordId(examRecordId).stream()
				                 .filter(ar -> ar.score() > 0)
				                 .mapToInt(AnswerRecord::score)
				                 .sum();
		
		// 成功 → GRADED
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId);
			draft.setScore(totalScore);
			draft.setStatus(ExamRecordStatus.GRADED);
		}), SaveMode.UPDATE_ONLY);
	}
}
