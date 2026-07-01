package com.yyjy.exam.question.repository;

import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.entity.QuestionsTable;
import com.yyjy.exam.entity.question.dto.QuestionsPageView;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.List;

public interface QuestionsRepository extends JRepository<Questions, Long> {

    boolean existsByTypeAndTitle(String type, String title);

    default List<QuestionsPageView> getLast(int size) {
        QuestionsTable t = QuestionsTable.$;
        return sql().createQuery(t)
                .orderBy(t.id().desc())
                .select(t.fetch(QuestionsPageView.class))
                .limit(size)
                .execute();
    }

    default List<QuestionsPageView> getLastNotIn(int size, List<Long> popularIds) {
        QuestionsTable t = QuestionsTable.$;
        return sql().createQuery(t)
                .where(t.id().notIn(popularIds))
                .select(t.fetch(QuestionsPageView.class))
                .limit(size)
                .execute();
    }

    default QuestionsPageView findQuestionsPageViewById(long id) {
        QuestionsTable t = QuestionsTable.$;
        return sql().createQuery(t)
                .where(t.id().eq(id))
                .select(t.fetch(QuestionsPageView.class))
                .fetchFirstOrNull();
    }

    default List<Long> findAllIds() {
        QuestionsTable t = QuestionsTable.$;
        return sql().createQuery(t)
                .select(t.id())
                .execute();
    }

    default List<String> titleIsRepeat(List<String> titles) {
        QuestionsTable t = QuestionsTable.$;
        return sql().createQuery(t)
                .where(t.title().in(titles))
                .select(t.title())
                .execute();
    }
}
