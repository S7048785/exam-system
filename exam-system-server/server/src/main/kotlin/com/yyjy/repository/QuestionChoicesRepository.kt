package com.yyjy.repository

import com.yyjy.models.entity.QuestionChoices
import org.babyfish.jimmer.spring.repository.KRepository

/**
 * @author Nyxcirea
 * date 2026/4/1
 * description: TODO
 */
interface QuestionChoicesRepository : KRepository<QuestionChoices, Long> {
    fun deleteByQuestionId(questionId: Long)
}
