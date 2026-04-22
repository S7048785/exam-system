package com.yyjy.service

import com.yyjy.common.BusinessException
import com.yyjy.constants.MessageConstant
import com.yyjy.constants.PaperConstant
import com.yyjy.models.dto.PaperAiSaveDto
import com.yyjy.models.entity.*
import com.yyjy.models.entity.dto.PaperDetail
import com.yyjy.models.entity.dto.PaperSaveInput
import com.yyjy.models.entity.dto.PaperUpdateInput
import com.yyjy.repository.PaperQuestionRepository
import com.yyjy.repository.PaperRepository
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode
import org.babyfish.jimmer.sql.ast.mutation.SaveMode
import org.babyfish.jimmer.sql.fetcher.Fetcher
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.babyfish.jimmer.sql.kt.ast.expression.`eq?`
import org.babyfish.jimmer.sql.kt.ast.expression.`valueIn?`
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.optionals.getOrNull

@Service
class PaperService(
    private val paperRepository: PaperRepository,
    private val paperQuestionRepo: PaperQuestionRepository,
) {
    companion object {
        private val log = LoggerFactory.getLogger(PaperService::class.java)
    }

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

    @Transactional
    fun addPaper(paperInput: PaperSaveInput) {
        if (paperInput.questions.isEmpty()) {
            throw BusinessException(MessageConstant.PAPER_QUESTION_EMPTY)
        }

        val paperQuestion = paperInput.questions.map {
            PaperQuestion {
                questionId = it.key.toLong()
                score = it.value.toDouble()
            }
        }
        val totalScore = paperQuestion.sumOf { it.score }
        val paper = Paper {
            name = paperInput.name
            description = paperInput.description
            duration = paperInput.duration
            paperQuestions = paperQuestion
            status = PaperConstant.STATUS.DRAFT
            questionCount = paperQuestion.size
            this.totalScore = totalScore
        }
        paperRepository.save(paper, SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND)
    }

    @Transactional
    fun aiCreatePaper(paperAiSaveDto: PaperAiSaveDto): Paper {
        if (paperAiSaveDto.rules.isEmpty()) {
            throw BusinessException(MessageConstant.PAPER_RULE_EMPTY)
        }
        val paperQuestionList = mutableListOf<PaperQuestion>()
        var questionCount = 0
        var totalScore = 0.0
        for (rule in paperAiSaveDto.rules) {
            if (rule.count == 0) {
                log.warn("Paper rule type ${rule.type} not found")
                continue
            }
            val allQuestions = paperRepository.sql.createQuery(Questions::class) {
                where(table.type `eq?` rule.type)
                where(table.categoryId `valueIn?` rule.categoryIds)
                select(table.id)
            }.execute()

            if (allQuestions.isEmpty()) {
                log.warn("Paper rule category ${rule.categoryIds} not found")
                continue
            }
            // 计算实际需要的题目数量
            val realNumbers = rule.count.coerceAtMost(allQuestions.size)
            questionCount += realNumbers
            totalScore += realNumbers.toDouble() * rule.score

            // 打乱题目顺序
            val questionsShuffled = allQuestions.shuffled().take(realNumbers)
            paperQuestionList.addAll(
                questionsShuffled.map {
                    PaperQuestion {
                        questionId = it
                        score = rule.score.toDouble()
                    }
                }
            )

        }
        return paperRepository.save(Paper {
            name = paperAiSaveDto.name
            description = paperAiSaveDto.description
            duration = paperAiSaveDto.duration
            paperQuestions = paperQuestionList
            status = PaperConstant.STATUS.DRAFT
            this.questionCount = questionCount
            this.totalScore = totalScore
        }, SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND)
    }

    @Transactional
    fun updatePaper(paperInput: PaperUpdateInput) {
        if (paperRepository.existsByName(paperInput.name)) throw BusinessException(MessageConstant.PAPER_NAME_EXIST)
        // 删除所有paperQuestion
        paperQuestionRepo.sql.createDelete(PaperQuestion::class) {
            where(table.paperId eq paperInput.id)
        }.execute()
        // 保存新的paperQuestion
        val paperQuestion = paperInput.questions.map {
            PaperQuestion {
                questionId = it.key.toLong()
                score = it.value.toDouble()
            }
        }
        paperInput.toEntity {
            this.paperQuestions = paperQuestion
        }
        paperRepository.save(paperInput.toEntity {
            this.paperQuestions = paperQuestion
        }, SaveMode.UPDATE_ONLY, AssociatedSaveMode.APPEND)
    }

    fun removePaper(id: Int) {
        val paperDb = paperRepository.findById(id).getOrNull() ?: throw BusinessException(MessageConstant.PAPER_NOT_FOUND)
        if (paperDb.status != PaperConstant.STATUS.DRAFT) {
            throw BusinessException(MessageConstant.PAPER_NOT_DRAFT_STATUS)
        }
        // TODO: 删除试卷时，需要检查试卷题目关联表是否有使用该试卷的考试
        paperRepository.deleteById(id)
    }

    fun updateStatus(id: Int, status: String) {
        if (status != PaperConstant.STATUS.STOPPED && status != PaperConstant.STATUS.PUBLISHED) {
            throw BusinessException(MessageConstant.PAPER_STATUS_INVALID)
        }
        paperRepository.save(Paper {
            this.id = id
            this.status = status
        }, SaveMode.UPDATE_ONLY)

    }
}
