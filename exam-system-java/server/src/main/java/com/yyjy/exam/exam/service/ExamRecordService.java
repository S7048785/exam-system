package com.yyjy.exam.exam.service;

import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.exam.entity.*;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.exam.repository.AnswerRecordRepository;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import com.yyjy.exam.question.constant.QuestionConstant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
@Service
public class ExamRecordService {
	
	private final ExamRecordsRepository examRecordsRepo;
	private final AnswerRecordRepository answerRecordRepo;
	private final ExamBulkGradingService examBulkGradingService;
	private final JSqlClient sqlClient;
	
	@Transactional
	public ExamRecords startExam(int paperId, String studentName) {
		/*
		  TODO: 新增功能:
		  1. 用户可多次考试、每次考试独立记录
		  2. 考试记录中添加字段: 考试时长、可设置最短考试时间
		  3. 考试结束自动提交
		 */
		ExamRecordsTable table = ExamRecordsTable.$;
		ExamRecords existing = sqlClient.createQuery(table)
				                       .where(table.paperId().eq(paperId))
				                       .select(table)
				                       .fetchFirstOrNull();
		
		if (existing != null) {
			
			if (existing.status() == ExamRecordStatus.ONGOING) {
				throw new BusinessException("考试已开始");
			} else {
				throw new BusinessException("考试已结束");
			}
		}
		
		var now = LocalDateTime.now();
		return examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setPaperId(paperId);
			draft.setStudentName(studentName);
			draft.setStartTime(now);
			draft.setCreateTime(now);
			draft.setWindowSwitches(0);
		}), SaveMode.INSERT_ONLY);
	}
	
	public ExamRecords getExamRecord(int id) {
		return examRecordsRepo.findById(id)
				       .orElseThrow(() -> new BusinessException("考试记录不存在"));
	}
	
	@Transactional
	public void submitAnswers(int examRecordId, List<SubmitAnswerReq> answers) {
		ExamRecords examRecord = examRecordsRepo.findById(examRecordId)
				                         .orElseThrow(() -> new BusinessException("考试记录不存在"));
		if (examRecord.status() != ExamRecordStatus.ONGOING) {
			throw new BusinessException("考试已提交");
		}
		
		for (SubmitAnswerReq answer : answers) {
			answerRecordRepo.save(AnswerRecordDraft.$.produce(draft -> {
				draft.setExamRecordId(examRecordId);
				draft.setQuestionId(answer.questionId());
				draft.setUserAnswer(answer.userAnswer());
			}));
		}
		
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecordId);
			draft.setStatus(ExamRecordStatus.SUBMITTED);
		}), SaveMode.UPDATE_ONLY);
		
		gradeExam(examRecordId);
	}
	
	/**
	 * 批改试卷
	 *
	 * @param examRecordId
	 * @return
	 */
	@Transactional
	public void gradeExam(int examRecordId) {
		ExamRecords examRecord = examRecordsRepo.findById(examRecordId)
				                         .orElseThrow(() -> new BusinessException("考试记录不存在"));
		
		if (examRecord.status() == ExamRecordStatus.ONGOING) {
			throw new BusinessException("考试未提交");
		}
		if (examRecord.status() == ExamRecordStatus.GRADED) {
			throw new BusinessException("试卷已批阅");
		}
		
		List<AnswerRecord> answerRecords = answerRecordRepo.findByExamRecordId(examRecord.id());
		
		for (AnswerRecord ar : answerRecords) {
			String type = ar.question().type();
			if (QuestionConstant.TYPE.CHOICE.equals(type)) {
				gradeChoiceQuestion(ar);
			} else if (QuestionConstant.TYPE.JUDGE.equals(type)) {
				gradeJudgeQuestion(ar);
			}
		}
		
		List<AnswerRecord> textAnswerRecords = answerRecords.stream()
				                                       .filter(ar -> QuestionConstant.TYPE.TEXT.equals(ar.question().type()))
				                                       .toList();
		if (!textAnswerRecords.isEmpty()) {
			aiEvaluation(textAnswerRecords);
		}
		
		examRecordsRepo.save(ExamRecordsDraft.$.produce(draft -> {
			draft.setId(examRecord.id());
			draft.setStatus(ExamRecordStatus.GRADED);
		}), SaveMode.UPDATE_ONLY);
	}
	
	private void gradeChoiceQuestion(AnswerRecord ar) {
		String userAnswer = ar.userAnswer();
		String correctAnswer = ar.question().questionAnswers() != null
				                       ? ar.question().questionAnswers().answer() : null;
		int userScore = 0;
		
		if (Boolean.TRUE.equals(ar.question().multi())) {
			if (correctAnswer != null) {
				Set<String> userSet = new HashSet<>(List.of(userAnswer.split(",")));
				Set<String> correctSet = new HashSet<>(List.of(correctAnswer.split(",")));
				userScore = userSet.equals(correctSet) ? ar.question().score() : 0;
			}
		} else {
			userScore = userAnswer.equals(correctAnswer) ? ar.question().score() : 0;
		}
		
		final int score = userScore;
		answerRecordRepo.save(AnswerRecordDraft.$.produce(draft -> {
			draft.setId(ar.id());
			draft.setScore(score);
			draft.setCorrect(score > 0 ? 1 : 0);
		}));
	}
	
	private void gradeJudgeQuestion(AnswerRecord ar) {
		String correctAnswer = ar.question().questionAnswers() != null
				                       ? ar.question().questionAnswers().answer() : null;
		int score = ar.userAnswer().equals(correctAnswer) ? ar.question().score() : 0;
		final int s = score;
		answerRecordRepo.save(AnswerRecordDraft.$.produce(draft -> {
			draft.setId(ar.id());
			draft.setScore(s);
			draft.setCorrect(s > 0 ? 1 : 0);
		}));
	}
	
	private void aiEvaluation(List<AnswerRecord> answerRecords) {
		List<com.yyjy.exam.entity.exam.io.req.QuestionTextGradingReq> requests = answerRecords.stream()
				                                                                         .map(ar -> new com.yyjy.exam.entity.exam.io.req.QuestionTextGradingReq(
						                                                                         ar.id(),
						                                                                         ar.question().title(),
						                                                                         ar.question().questionAnswers().answer(),
						                                                                         ar.question().score(),
						                                                                         ar.userAnswer()
				                                                                         ))
				                                                                         .toList();
		examBulkGradingService.batchGrading(requests);
	}
}
