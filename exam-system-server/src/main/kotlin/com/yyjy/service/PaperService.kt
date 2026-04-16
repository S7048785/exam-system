package com.yyjy.service

import com.yyjy.common.BusinessException
import com.yyjy.constants.MessageConstant
import com.yyjy.models.entity.*
import com.yyjy.models.entity.dto.PaperDetail
import com.yyjy.models.entity.dto.PaperSaveInput
import com.yyjy.repository.PaperRepository
import org.babyfish.jimmer.sql.ast.mutation.SaveMode
import org.babyfish.jimmer.sql.fetcher.Fetcher
import org.babyfish.jimmer.sql.kt.ast.expression.`eq?`
import org.springframework.stereotype.Service

@Service
class PaperService(
    private val paperRepository: PaperRepository
) {
    fun listPapersByNameAndStatus(name: String?, status: String?, paperItem: Fetcher<Paper>): List<Paper> {
        return paperRepository.sql.createQuery(Paper::class) {
            where(table.name `eq?` name)
            where(table.status `eq?` status)
            select(table.fetch(paperItem))
        }.execute()
    }

    fun getPaper(id: Int): PaperDetail {
        val paper = paperRepository.sql.createQuery(Paper::class) {
            where(table.id `eq?` id)
            select(table.fetch(PaperDetail::class))
        }.fetchOneOrNull() ?: throw BusinessException(MessageConstant.PAPER_NOT_FOUND)


        // 对题目进行排序
        val questionsSorted = paper.questions.sortedBy {
            when (it.type) {
                "CHOICE" -> 1
                "JUDGE" -> 2
                "TEXT" -> 3
                else -> throw BusinessException(MessageConstant.QUESTION_TYPE_NOT_EXIST)
            }
        }
        paper.questions = questionsSorted
        return paper
    }

    fun addPaper(paperInput: PaperSaveInput){

        val paperQuestion = paperInput.questions.map {
            PaperQuestion {
                questionId = it.key.toLong()
                score = it.value.toDouble()
            }
        }
        val paper = Paper {
            name = paperInput.name
            description = paperInput.description
            duration = paperInput.duration
            paperQuestions = paperQuestion
        }
        paperRepository.save(paper, SaveMode.INSERT_ONLY)
    }
}
