package com.yyjy.exam.paper.service;

import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.paper.constant.PaperStatus;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.entity.*;
import com.yyjy.exam.entity.paper.dto.PaperSaveInput;
import com.yyjy.exam.entity.paper.dto.PaperUpdateInput;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.question.entity.QuestionsTable;
import com.yyjy.exam.paper.constant.PaperConstant;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import com.yyjy.exam.paper.repository.PaperRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PaperService {
	
    private final PaperRepository paperRepository;
    private final PaperQuestionRepository paperQuestionRepo;
    private final JSqlClient sqlClient;
    
    public List<Paper> listPapersByNameAndStatus(String name, PaperStatus status) {
        PaperTable paper = PaperTable.$;
        var query = sqlClient.createQuery(paper);
        if (name != null && !name.isBlank()) {
            query = query.where(paper.name().like("%" + name + "%"));
        }
        if (status != null) {
            query = query.where(paper.status().eq(status.getValue()));
        }
        return query.select(paper).execute();
    }

    public PaperDetail getPaper(int id) {
        PaperTable paper = PaperTable.$;
        PaperDetail result = sqlClient.createQuery(paper)
                .where(paper.id().eq(id))
                .select(paper.fetch(PaperDetail.class))
                .fetchFirstOrNull();
        if (result == null) {
            throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
        }

        List<PaperDetail.TargetOf_questions> sorted = result.getQuestions().stream()
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
        if (paperInput.getQuestions().isEmpty()) {
            throw new BusinessException(MessageConstant.PAPER_QUESTION_EMPTY);
        }

        double totalScore = paperInput.getQuestions().values().stream().mapToDouble(Integer::doubleValue).sum();

        paperRepository.save(PaperDraft.$.produce(draft -> {
            draft.setName(paperInput.getName());
            draft.setDescription(paperInput.getDescription());
            draft.setDuration(paperInput.getDuration());
            draft.setStatus(PaperConstant.STATUS.DRAFT);
            draft.setQuestionCount(paperInput.getQuestions().size());
            draft.setTotalScore(totalScore);
            for (var entry : paperInput.getQuestions().entrySet()) {
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
        if (paperRepository.existsByNameAndIdNot(paperInput.getName(), paperInput.getId())) {
            throw new BusinessException(MessageConstant.PAPER_NAME_EXIST);
        }

        sqlClient.createDelete(PaperQuestionTable.$)
                .where(PaperQuestionTable.$.paperId().eq(paperInput.getId()))
                .execute();

        paperRepository.save(PaperDraft.$.produce(draft -> {
            draft.setId(paperInput.getId());
            draft.setName(paperInput.getName());
            draft.setDescription(paperInput.getDescription());
            draft.setDuration(paperInput.getDuration());
            for (Map.Entry<? extends String, ? extends Integer> entry : paperInput.getQuestions().entrySet()) {
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

        ExamRecordsTable ert = ExamRecordsTable.$;
        boolean hasExamRecords = sqlClient.createQuery(ert)
                .where(ert.paperId().eq(id))
                .select(ert)
                .limit(1)
                .fetchFirstOrNull() != null;
        if (hasExamRecords) {
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

        QuestionsTable qt = QuestionsTable.$;
        Map<Long, Double> questionScores = new LinkedHashMap<>();
        int questionCount = 0;
        double totalScore = 0.0;

        for (PaperAiSaveDto.Rule rule : dto.getRules()) {
            if (rule.getCount() <= 0) continue;

            List<Long> allIds = sqlClient.createQuery(qt)
                    .where(qt.type().eq(rule.getType()))
                    .where(qt.categoryId().in(rule.getCategoryIds()))
                    .select(qt.id())
                    .execute();

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
