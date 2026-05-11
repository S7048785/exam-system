package com.yyjy.service

import com.yyjy.constants.QuestionConstant
import com.yyjy.models.dto.QuestionTextGradingRequest
import com.yyjy.models.dto.SubmitAnswerDto
import com.yyjy.models.entity.*
import com.yyjy.models.entity.ExamRecordStatus.*
import com.yyjy.models.entity.dto.ExamRecordDetail
import com.yyjy.models.entity.dto.ExamStartView
import com.yyjy.repository.AnswerRecordRepository
import com.yyjy.repository.ExamRecordsRepository
import org.babyfish.jimmer.sql.ast.mutation.SaveMode
import org.babyfish.jimmer.sql.kt.KSqlClient
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime
import kotlin.jvm.optionals.getOrNull

@Service
class ExamRecordService(
    private val examRecordsRepo: ExamRecordsRepository,
    private val answerRecordRepo: AnswerRecordRepository,
    private val transactionTemplate: TransactionTemplate,
    private val examBulkGradingService: ExamBulkGradingService,
    private val sqlClient: KSqlClient,
) {

    @Transactional
    fun startExam(paperId: Int, studentName: String): ExamStartView {
        val examRecord = examRecordsRepo.findById(paperId).getOrNull()

        if (examRecord != null) {
            when (examRecord.status) {
                ONGOING -> {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "考试已开始")
                }
                else -> {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "考试已结束")
                }
            }
        }

        return ExamStartView(examRecordsRepo.save(ExamRecords {
            this.paperId = paperId
            this.studentName = studentName
            this.startTime = LocalDateTime.now()
            this.createTime = LocalDateTime.now()
            this.windowSwitches = 0
        }, SaveMode.INSERT_ONLY))
    }

    fun getExamRecord(id: Int): ExamRecordDetail {
        return examRecordsRepo.sql.createQuery(ExamRecords::class) {
            where(table.id eq id)
            select(table.fetch(ExamRecordDetail::class))
        }.fetchFirstOrNull() ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "考试记录不存在")

    }

    suspend fun submitAnswers(examRecordId: Int, answers: List<SubmitAnswerDto>) {
        val examRecord = examRecordsRepo.findById(examRecordId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "考试记录不存在") }
        // 1. 检查考试记录是否存在
        if (examRecord.status != ONGOING) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "考试已提交")
        }

        // 事务1：提交答案
        transactionTemplate.execute {
            // 保存所有答题记录
            val answerRecords = answers.map {
                AnswerRecord {
                    this.examRecordId = examRecordId
                    this.questionId = it.questionId.toLong()
                    this.userAnswer = it.userAnswer
                }
            }
            answerRecordRepo.saveAll(answerRecords)

            // 更新状态和用户答案（原 sql.createUpdate 写法）
            examRecordsRepo.sql.createUpdate(ExamRecords::class) {
                set(table.status, SUBMITTED)
                where(table.id eq examRecordId)
            }
        }

        // 3. 调用批改方法（继承当前事务）
        gradeExam(examRecordId)

    }

    suspend fun gradeExam(examRecordId: Int): ExamRecords {
        val examRecord = examRecordsRepo.findById(examRecordId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "考试记录不存在") }
        when (examRecord.status) {
            ONGOING -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "考试未提交")
            GRADED -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "试卷已批阅")
            else -> {}
        }

        // 1. 从数据库中获取试卷的所有题目和答案
        val paperQuestionsMap = sqlClient.createQuery(PaperQuestion::class) {
            where(table.paperId eq examRecord.paperId)
            select(table.fetchBy {
                question {
                    title()
                    type()
                    questionAnswers {
                        answer()
                    }
                }
                score()
            })
        }.execute().associateBy { it.question.id }

        // 获取答题记录
        val answerRecords = answerRecordRepo.findByExamId(examRecord.id)

        // 保存批改非简答题题目结果到数据库
        sqlClient.saveEntities(answerRecords.map {
            val question = paperQuestionsMap[it.questionId]

            if (it.question.type == QuestionConstant.TYPE.CHOICE) {
                val userAnswer = it.userAnswer
                val correctAnswer = question?.question?.questionAnswers?.answer
                val userScore: Int

                if (it.question.multi == true) {
                    val userSet = userAnswer.split(",").map { it.trim() }.toSet()
                    val correctSet = correctAnswer!!.split(",").map { it.trim() }.toSet()
                    userScore = if (userSet == correctSet) question.score.toInt() else 0
                } else {
                    userScore = if (userAnswer == correctAnswer) question.score.toInt() else 0
                }

                // 单选题
                return@map AnswerRecord {
                    this.id = it.id
                    this.score = userScore
                    this.correct = if (userScore > 0) 1 else 0
                }

            } else if (it.question.type == QuestionConstant.TYPE.JUDGE) {
                // 判断题
                val score = if (it.userAnswer == question?.question?.questionAnswers?.answer) question.score.toInt() else 0
                return@map AnswerRecord {
                    this.id = it.id
                    this.score = score
                    this.correct = if (score > 0) 1 else 0
                }
            } else {

            }
        })

        val textAnswerRecords = answerRecords.filter { it.question.type == QuestionConstant.TYPE.TEXT }
        aiEvaluation(textAnswerRecords)

        return examRecordsRepo.save(examRecord.copy {
            this.status = GRADED
        })
    }

    // AI批阅简答题
    suspend fun aiEvaluation(answerRecords: List<AnswerRecord>) {
        val requests = answerRecords.map {
            QuestionTextGradingRequest(
                recordId = it.id,
                title = it.question.title,
                userAnswer = it.userAnswer,
                answer = it.question.questionAnswers!!.answer,
                score = it.question.score!!.toInt(),
            )
        }
        examBulkGradingService.batchGrading(requests)
    }

}