package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.paper.entity.PaperQuestion;
import com.yyjy.exam.entity.paper.entity.PaperQuestionTable;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.HashMap;
import java.util.Map;

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
    
    /**
     * 该试卷的题目集（questionId → 分值），用于比对提交上来的题目是否与库中一致
     * （已发布的试卷只允许改元数据、不允许动题目）。
     */
    default Map<Long, Integer> findScoreMapByPaperId(int paperId) {
        PaperQuestionTable t = PaperQuestionTable.$;
        Map<Long, Integer> result = new HashMap<>();
        for (var tuple : sql().createQuery(t)
                .where(t.paperId().eq(paperId))
                .select(t.questionId(), t.score())
                .execute()) {
            result.put(tuple.get_1(), tuple.get_2());
        }
        return result;
    }
}
