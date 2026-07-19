package com.yyjy.exam.paper.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.dto.PaperListQuery;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperDraft;
import com.yyjy.exam.entity.paper.entity.PaperQuestionDraft;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionAddReq;
import com.yyjy.exam.entity.paper.io.req.PaperSaveInput;
import com.yyjy.exam.entity.paper.io.req.PaperSaveV2Input;
import com.yyjy.exam.entity.paper.io.req.PaperUpdateInput;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import com.yyjy.exam.paper.repository.PaperRepository;
import com.yyjy.exam.question.repository.QuestionsRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaperService {
	
	private final PaperRepository paperRepository;
	private final PaperQuestionRepository paperQuestionRepo;
	private final QuestionsRepository questionsRepository;
	
	public List<Paper> listPapersByNameAndStatus(PaperListQuery conditions, Fetcher<Paper> fetcher) {
		PaperTable paper = PaperTable.$;
		
		int page = Objects.requireNonNullElse(conditions.getPage(), 1);
		int size = Objects.requireNonNullElse(conditions.getSize(), 10);
		
		var query = paperRepository.sql().createQuery(paper);
		
		if (Boolean.TRUE.equals(conditions.getOngoing())) {
			query.where(paper.end().ge(LocalDateTime.now()));
			
		} else if (Boolean.FALSE.equals(conditions.getOngoing())) {
			query.where(paper.end().lt(LocalDateTime.now()));
		}
		
		return query
				       .select(paper.fetch(fetcher))
				       .limit(size, (long) (page - 1) * size)
				       .execute();
	}
	
	public PaperDetail getPaper(int id) {
		PaperDetail result = paperRepository.findDetailById(id);
		if (result == null) {
			throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		}
		
		List<PaperDetail.TargetOf_questions> sorted =
				result.getQuestions().stream()
						.sorted(Comparator.comparingInt(q -> switch (q.getType()) {
							case "CHOICE" -> 1;
							case "JUDGE" -> 2;
							case "TEXT" -> 3;
							default -> throw new BusinessException(MessageConstant.QUESTION_TYPE_NOT_EXIST);
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
		
		var userId = StpUtil.getLoginIdAsLong();
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setUserId(userId);
			draft.setName(paperInput.name());
			draft.setDescription(paperInput.description());
			draft.setDuration(paperInput.duration());
			draft.setCategoryId(paperInput.categoryId());
			draft.setPublished(false);
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
			draft.setCategoryId(paperInput.categoryId());
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
		
		if (paperRepository.hasExamRecords(id)) {
			throw new BusinessException(MessageConstant.PAPER_ALREADY_IN_EXAM);
		}
		
		paperRepository.deleteById(id);
	}
	
	public List<PaperDetail.TargetOf_questions> getPaperQuestions(int id) {
		PaperDetail detail = paperRepository.findDetailById(id);
		if (detail == null) throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		return detail.getQuestions();
	}
	
	@Transactional
	public int addPaperV2(PaperSaveV2Input input) {
		if (paperRepository.existsByName(input.name())) {
			throw new BusinessException(MessageConstant.PAPER_NAME_EXIST);
		}
		long userId = StpUtil.getLoginIdAsLong();
		Paper paper = paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setUserId(userId);
			draft.setName(input.name());
			draft.setDescription(input.description());
			draft.setDuration(input.duration());
			draft.setCategoryId(input.categoryId());
			draft.setPublished(false);
			draft.setQuestionCount(0);
			draft.setTotalScore(0.0);
		}), SaveMode.INSERT_ONLY);
		return paper.id();
	}
	
	@Transactional
	public void publishPaper(int id) {
		Paper paper = paperRepository.findById(id)
				              .orElseThrow(() -> new BusinessException(MessageConstant.PAPER_NOT_FOUND));
		if (paper.published()) {
			throw new BusinessException(MessageConstant.PAPER_IS_PUBLISHED);
		}
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setId(id);
			draft.setPublished(true);
		}), SaveMode.UPDATE_ONLY);
	}
	
	@Transactional
	public void addPaperQuestions(int paperId, PaperQuestionAddReq input) {
		
		for (var item : input.questions()) {
			var existing = paperQuestionRepo.findByPaperIdAndQuestionId(paperId, item.questionId());
			
			if (existing != null) {
				paperQuestionRepo.save(PaperQuestionDraft.$.produce(draft -> {
					draft.setId(existing.id());
					draft.setScore(item.score());
				}), SaveMode.UPDATE_ONLY);
			} else {
				paperQuestionRepo.save(PaperQuestionDraft.$.produce(draft -> {
					draft.setPaperId(paperId);
					draft.setQuestionId(item.questionId());
					draft.setScore(item.score());
				}), SaveMode.INSERT_ONLY);
			}
		}
		
		paperRepository.recalculateTotals(paperId);
	}
	
	@Transactional
	public void removePaperQuestion(int paperId, long questionId) {
		paperQuestionRepo.deleteByPaperIdAndQuestionId(paperId, questionId);
		paperRepository.recalculateTotals(paperId);
	}
	
	@Transactional
	public void updatePaperQuestionScore(int paperId, long questionId, double score) {
		var existing = paperQuestionRepo.findByPaperIdAndQuestionId(paperId, questionId);
		if (existing == null) throw new BusinessException("试卷中不存在该题目");
		
		paperQuestionRepo.save(PaperQuestionDraft.$.produce(draft -> {
			draft.setId(existing.id());
			draft.setScore(score);
		}), SaveMode.UPDATE_ONLY);
		
		paperRepository.recalculateTotals(paperId);
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
			draft.setPublished(false);
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
