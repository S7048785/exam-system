package com.yyjy.exam.paper.service;

import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperDraft;
import com.yyjy.exam.entity.paper.io.req.PaperSaveInput;
import com.yyjy.exam.entity.paper.io.req.PaperUpdateInput;
import com.yyjy.exam.paper.constant.PaperConstant;
import com.yyjy.exam.paper.constant.PaperStatus;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import com.yyjy.exam.paper.repository.PaperRepository;
import com.yyjy.exam.question.repository.QuestionsRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PaperService {
	
	private final PaperRepository paperRepository;
	private final PaperQuestionRepository paperQuestionRepo;
	private final QuestionsRepository questionsRepository;
	
	public List<Paper> listPapersByNameAndStatus(String name, PaperStatus status, Fetcher<Paper> fetcher) {
		return paperRepository.listByNameAndStatus(name, status, fetcher);
	}
	
	public PaperDetail getPaper(int id) {
		PaperDetail result = paperRepository.findDetailById(id);
		if (result == null) {
			throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		}
		
		List<PaperDetail.TargetOf_questions> sorted = result.getQuestions().stream()
				                                              .sorted(Comparator.comparingInt(q -> switch (q.getType()) {
					                                              case "CHOICE" -> 1;
					                                              case "JUDGE" -> 2;
					                                              case "TEXT" -> 3;
					                                              default ->
							                                              throw new BusinessException(MessageConstant.QUESTION_TYPE_NOT_EXIST);
				                                              }))
				                                              .toList();
		
		result.setQuestions(sorted);
		return result;
	}
	
	@Transactional
	public void addPaper(PaperSaveInput paperInput) {
		if (paperInput.questions().isEmpty()) {
			throw new BusinessException(MessageConstant.PAPER_QUESTION_EMPTY);
		}
		
		double totalScore = paperInput.questions().values().stream().mapToDouble(Integer::doubleValue).sum();
		
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setName(paperInput.name());
			draft.setDescription(paperInput.description());
			draft.setDuration(paperInput.duration());
			draft.setStatus(PaperConstant.STATUS.DRAFT);
			draft.setQuestionCount(paperInput.questions().size());
			draft.setTotalScore(totalScore);
			for (var entry : paperInput.questions().entrySet()) {
				long questionId = Long.parseLong(entry.getKey());
				double score = entry.getValue().doubleValue();
				draft.addIntoPaperQuestions(pq -> {
					pq.setQuestionId(questionId);
					pq.setScore(score);
				});
			}
		}), SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND);
	}
	
	@Transactional
	public void updatePaper(PaperUpdateInput paperInput) {
		if (paperRepository.existsByNameAndIdNot(paperInput.name(), paperInput.id())) {
			throw new BusinessException(MessageConstant.PAPER_NAME_EXIST);
		}
		
		paperQuestionRepo.deleteByPaperId(paperInput.id());
		
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setId(paperInput.id());
			draft.setName(paperInput.name());
			draft.setDescription(paperInput.description());
			draft.setDuration(paperInput.duration());
			for (Map.Entry<String, Integer> entry : paperInput.questions().entrySet()) {
				long questionId = Long.parseLong(entry.getKey());
				double score = entry.getValue().doubleValue();
				draft.addIntoPaperQuestions(pq -> {
					pq.setQuestionId(questionId);
					pq.setScore(score);
				});
			}
		}), SaveMode.UPDATE_ONLY, AssociatedSaveMode.APPEND);
	}
	
	@Transactional
	public void removePaper(int id) {
		Paper paperDb = paperRepository.findById(id)
				                .orElseThrow(() -> new BusinessException(MessageConstant.PAPER_NOT_FOUND));
		if (!PaperConstant.STATUS.DRAFT.equals(paperDb.status())) {
			throw new BusinessException(MessageConstant.PAPER_NOT_DRAFT_STATUS);
		}
		
		if (paperRepository.hasExamRecords(id)) {
			throw new BusinessException(MessageConstant.PAPER_ALREADY_IN_EXAM);
		}
		
		paperRepository.deleteById(id);
	}
	
	@Transactional
	public void updateStatus(int id, String status) {
		if (!PaperConstant.STATUS.STOPPED.equals(status) && !PaperConstant.STATUS.PUBLISHED.equals(status)) {
			throw new BusinessException(MessageConstant.PAPER_STATUS_INVALID);
		}
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setId(id);
			draft.setStatus(status);
		}), SaveMode.UPDATE_ONLY);
	}
	
	@Transactional
	public Paper aiCreatePaper(PaperAiSaveDto dto) {
		if (dto.getRules().isEmpty()) {
			throw new BusinessException(MessageConstant.PAPER_RULE_EMPTY);
		}
		
		Map<Long, Double> questionScores = new LinkedHashMap<>();
		int questionCount = 0;
		double totalScore = 0.0;
		
		for (PaperAiSaveDto.Rule rule : dto.getRules()) {
			if (rule.getCount() <= 0) continue;
			
			List<Long> allIds = questionsRepository.findIdsByTypeAndCategoryIds(rule.getType(), rule.getCategoryIds());
			
			if (allIds.isEmpty()) continue;
			
			int realCount = Math.min(rule.getCount(), allIds.size());
			Collections.shuffle(allIds);
			
			for (int i = 0; i < realCount; i++) {
				questionScores.put(allIds.get(i), (double) rule.getScore());
			}
			
			questionCount += realCount;
			totalScore += realCount * (double) rule.getScore();
		}
		
		int finalQuestionCount = questionCount;
		double finalTotalScore = totalScore;
		return paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setName(dto.getName());
			draft.setDescription(dto.getDescription());
			draft.setDuration(dto.getDuration());
			draft.setStatus(PaperConstant.STATUS.DRAFT);
			draft.setQuestionCount(finalQuestionCount);
			draft.setTotalScore(finalTotalScore);
			for (Map.Entry<Long, Double> entry : questionScores.entrySet()) {
				draft.addIntoPaperQuestions(pq -> {
					pq.setQuestionId(entry.getKey());
					pq.setScore(entry.getValue());
				});
			}
		}), SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND);
	}
}
