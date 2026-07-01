package com.yyjy.exam.question.repository;

import com.yyjy.exam.entity.question.entity.QuestionChoices;
import org.babyfish.jimmer.spring.repository.JRepository;

public interface QuestionChoicesRepository extends JRepository<QuestionChoices, Long> {

    void deleteByQuestionId(long questionId);
}
