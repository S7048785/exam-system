package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.paper.entity.PaperQuestion;
import com.yyjy.exam.entity.paper.entity.PaperQuestionTable;
import org.babyfish.jimmer.spring.repository.JRepository;

public interface PaperQuestionRepository extends JRepository<PaperQuestion, Integer> {

    default void deleteByPaperId(int paperId) {
        PaperQuestionTable t = PaperQuestionTable.$;
        sql().createDelete(t)
                .where(t.paperId().eq(paperId))
                .execute();
    }

    default PaperQuestion findByPaperIdAndQuestionId(int paperId, long questionId) {
        PaperQuestionTable t = PaperQuestionTable.$;
        return sql().createQuery(t)
                .where(t.paperId().eq(paperId))
                .where(t.questionId().eq(questionId))
                .select(t)
                .fetchFirstOrNull();
    }

    default void deleteByPaperIdAndQuestionId(int paperId, long questionId) {
        PaperQuestionTable t = PaperQuestionTable.$;
        sql().createDelete(t)
                .where(t.paperId().eq(paperId))
                .where(t.questionId().eq(questionId))
                .execute();
    }
}
