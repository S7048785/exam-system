package com.yyjy.service

import com.yyjy.common.BusinessException
import com.yyjy.constants.MessageConstant
import com.yyjy.constants.QuestionConstant
import com.yyjy.models.entity.Categories
import com.yyjy.models.entity.Questions
import com.yyjy.models.entity.dto.QuestionImportInput
import com.yyjy.models.entity.dto.QuestionSaveInput
import com.yyjy.models.entity.id
import com.yyjy.repository.QuestionsRepository
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode
import org.babyfish.jimmer.sql.ast.mutation.SaveMode
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.babyfish.jimmer.sql.kt.exists
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * @author Nyxcirea
 * @date 2026/4/12
 */
@Service
class QuestionImportService(
    private val questionsRepository: QuestionsRepository,
) {

    @Transactional
    fun importBatch(question: List<QuestionImportInput>): String {
        if (question.isEmpty()) throw BusinessException(MessageConstant.QUESTION_NOT_EMPTY)

        var okCount = 0
        // 批量导入题目
        for (item in question) {
            if (!questionsRepository.sql.exists(Categories::class) {
                    where(table.id eq item.categoryId)
                }) {
                throw BusinessException("${MessageConstant.QUESTION_CATEGORY_NOT_EXIST} ${item.categoryId} ")
            }
            val questionSaveInput = QuestionSaveInput(
                title = item.title,
                type = item.type,
                multi = item.multi,
                categoryId = item.categoryId,
                difficulty = item.difficulty,
                score = item.score,
                analysis = item.analysis,
                answers = QuestionSaveInput.TargetOf_answers(
                    answer = item.answer!!,
                )
            )
            if (item.type == QuestionConstant.TYPE.CHOICE && !item.choices.isNullOrEmpty()) {
                questionSaveInput.choices = item.choices!!.map { choice ->
                    QuestionSaveInput.TargetOf_choices(
                        correct = choice.correct,
                        content = choice.content,
                        sort = choice.sort,
                    )
                }
            }

            questionsRepository.save(questionSaveInput) {
                setMode(SaveMode.INSERT_ONLY)
                setAssociatedMode(Questions::questionAnswers, AssociatedSaveMode.APPEND)
                setAssociatedMode(Questions::questionChoices, AssociatedSaveMode.APPEND)
            }
            okCount++
        }
        return "批量导入成功: ${okCount}/${question.size}"
    }
}