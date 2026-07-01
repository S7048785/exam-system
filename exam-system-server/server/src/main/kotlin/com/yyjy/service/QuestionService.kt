package com.yyjy.service

import cn.hutool.core.collection.CollUtil
import com.alibaba.excel.EasyExcel
import com.alibaba.excel.write.style.column.LongestMatchColumnWidthStyleStrategy
import com.yyjy.common.BusinessException
import com.yyjy.constants.CacheConstant
import com.yyjy.constants.MessageConstant
import com.yyjy.constants.QuestionConstant
import com.yyjy.models.bo.QuestionExcelTemplateBo
import com.yyjy.models.dto.QuestionGenerateDto
import com.yyjy.models.entity.*
import com.yyjy.models.entity.dto.*
import com.yyjy.models.req.QuestionGenerateReq
import com.yyjy.models.req.QuestionListReq
import com.yyjy.models.res.QuestionPageRes
import com.yyjy.repository.QuestionChoicesRepository
import com.yyjy.repository.QuestionsRepository
import com.yyjy.utils.ExcelUtil
import com.yyjy.utils.RedisUtil
import jakarta.servlet.http.HttpServletResponse
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode
import org.babyfish.jimmer.sql.ast.mutation.SaveMode
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.babyfish.jimmer.sql.kt.ast.expression.`eq?`
import org.babyfish.jimmer.sql.kt.ast.expression.like
import org.babyfish.jimmer.sql.kt.exists
import org.springframework.data.redis.core.DefaultTypedTuple
import org.springframework.data.redis.core.ZSetOperations
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.net.URLEncoder
import kotlin.jvm.optionals.getOrElse

@Service
class QuestionService(
    private val questionsRepository: QuestionsRepository,
    private val questionChoicesRepository: QuestionChoicesRepository,
    private val redisUtil: RedisUtil,
    private val questionImportService: QuestionImportService,
    private val questionGenerateService: QuestionGenerateService
) {

    @Transactional
    fun save(question: QuestionSaveInput): Questions {
        if (questionsRepository.existsByTypeAndTitle(question.type, question.title)) {
            throw BusinessException(MessageConstant.QUESTION_EXIST)
        }
        if (!questionsRepository.sql.exists(Categories::class) {
                where(table.id eq question.categoryId)
            }) {
            throw BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST)
        }

        if (question.type == "CHOICE") {
            if (question.choices == null) {
                throw BusinessException(MessageConstant.QUESTION_CHOICE_CHOICES_NOT_EMPTY)
            }
            var answerStr = ""
            for ((index, targetofChoices) in question.choices!!.withIndex()) {
                targetofChoices.sort = index
                if (targetofChoices.correct == true) {
                    if (answerStr.isNotEmpty()) {
                        if (question.multi == false) {
                            throw BusinessException(MessageConstant.QUESTION_CHOICE_MULTI_ANSWER_NOT_EMPTY)
                        }
                        answerStr += ","
                    }
                    answerStr += 'A' + index
                }
            }
            question.answers?.answer = answerStr
        } else {
            if (question.multi == true) {
                throw BusinessException(MessageConstant.QUESTION_CHOICE_MULTI_NOT_EMPTY)
            }
        }

        return questionsRepository.save(question) {
            // 1. 解决 <root> 问题：告诉 Jimmer 根对象直接插入，不要去找 ID
            setMode(SaveMode.INSERT_ONLY)
            // 2. 解决 <root>.questionAnswers 问题：告诉 Jimmer 子对象直接追加
            setAssociatedMode(Questions::questionAnswers, AssociatedSaveMode.APPEND)
            // 3. 解决 <root>.questionChoices 问题：告诉 Jimmer 子对象直接追加
            setAssociatedMode(Questions::questionChoices, AssociatedSaveMode.APPEND)
        }
    }

    @Transactional
    fun update(question: QuestionUpdateInput): Questions {
        if (!questionsRepository.sql.exists(Categories::class) {
                where(table.id eq question.categoryId)
            }) {
            throw BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST)
        }
        val oldQuestion =
            questionsRepository.findById(question.id)
                .getOrElse { throw BusinessException(MessageConstant.QUESTION_NOT_EXIST) }

        // 查询同类型下是否有同名题目
        if (questionsRepository.existsByTypeAndTitle(oldQuestion.type, question.title)) {
            throw BusinessException(MessageConstant.QUESTION_EXIST)
        }

        if (oldQuestion.type == QuestionConstant.TYPE.CHOICE) {
            // 删除所有选择题选项
            questionChoicesRepository.deleteByQuestionId(question.id)
        }

        return questionsRepository.save(question, SaveMode.UPDATE_ONLY)
    }

    fun remove(id: Long) {
        questionsRepository.deleteById(id)
    }

    fun getById(id: Long): QuestionsPageView {
        val question = questionsRepository.sql.entities.findById(QuestionsPageView::class, id)
            ?: throw BusinessException(MessageConstant.QUESTION_NOT_EXIST)
        // 开启一个异步协程 存入缓存
        CoroutineScope(Dispatchers.IO).launch {
            redisUtil.zIncrementScore(CacheConstant.POPULAR_QUESTIONS_KEY, id.toString(), 1.0)
        }
        return question
    }

    fun list(req: QuestionListReq): QuestionPageRes {
        val page = req.page ?: 1
        val size = req.size ?: 10
        val pageResult = questionsRepository.sql.createQuery(Questions::class) {
            where(table.categoryId `eq?` req.categoryId)
            where(table.difficulty `eq?` req.difficulty)
            where(table.type `eq?` req.type)
            req.keyword?.takeIf { it.isNotBlank() }?.let {
                where(table.title like "%${req.keyword}%")
            }
            select(table.fetch(QuestionsPageView::class))
        }.fetchPage(page - 1, size)
        return QuestionPageRes(
            size = size,
            records = pageResult.rows,
            total = pageResult.totalRowCount,
            current = page,
            pages = pageResult.totalPageCount
        )
    }

    fun getPopularQuestions(size: Int): List<QuestionsPageView> {
        val popularIdSet =
            redisUtil.zReverseRangeWithScores(CacheConstant.POPULAR_QUESTIONS_KEY, 0, (size - 1).toLong())
        if (CollUtil.isEmpty(popularIdSet)) {
            return questionsRepository.getLast(size)
        }
        // 从缓存中获取的题目ID列表
        val popularIdsList = popularIdSet?.mapNotNull { item ->
            item.value?.toString()?.toLongOrNull()
        } ?: emptyList()

        // 从数据库中获取的题目列表
        val popularQuestionList = mutableListOf<QuestionsPageView>()

        val newPopularIdsList = mutableListOf<Long>()
        for (questionId in popularIdsList) {
            questionsRepository.findQuestionsPageViewById(questionId)?.let {
                newPopularIdsList.add(questionId)
                popularQuestionList.add(it)
            }
        }

        if (popularQuestionList.size < size) {
            val notInQuestions = questionsRepository.getLastNotIn(size - newPopularIdsList.size, newPopularIdsList)
            popularQuestionList.addAll(notInQuestions)
        }
        return popularQuestionList
    }

    fun refreshPopularQuestions() {
        // 删除缓存
        redisUtil.delete(CacheConstant.POPULAR_QUESTIONS_KEY)
        // 查询所有题目id
        val questionIds = questionsRepository.findAllIds()
        // 存入缓存
        val tuples: Set<ZSetOperations.TypedTuple<Any>> =
            questionIds.mapTo(HashSet()) { DefaultTypedTuple(it.toString(), 0.0) }
        redisUtil.zAdd(CacheConstant.POPULAR_QUESTIONS_KEY, tuples)
    }

    fun exportTemplate(response: HttpServletResponse) {
        // 设置响应结果类型
        // ms-excel: 微软的excel格式
        response.contentType = "application/vnd.ms-excel"
        response.characterEncoding = "utf-8"

        // 防止中文乱码
        val fileName = URLEncoder.encode("Excel题目模板", "UTF-8")
        // 设置响应头Content-Disposition标识任何格式都以下载方式打开
        response.addHeader("Content-Disposition", "attachment;filename=$fileName.xlsx")

        // 生成模板文件
        EasyExcel.write(response.outputStream, QuestionExcelTemplateBo::class.java).registerWriteHandler(
            LongestMatchColumnWidthStyleStrategy()
        ).sheet("题目模板")
            .doWrite(
                listOf(
                    QuestionExcelTemplateBo(
                        content = "以下哪个是Spring框架的核心特性?",
                        type = "CHOICE",
                        multiple = "否",
                        categoryId = "1",
                        difficulty = "MEDIUM",
                        score = "5",
                        choiceA = "依赖注入",
                        choiceB = "面向切面编程",
                        choiceC = "事务管理",
                        choiceD = "以上都是",
                        answer = "D",
                        analysis = "Spring框架的核心特性包括依赖注入、面向切面编程和事务管理等。"
                    )
                )
            )
    }

    fun parseExcel(file: MultipartFile): List<QuestionImportView> {
        return ExcelUtil.parseExcelToQuestions(file)
    }

    fun importBatch(question: List<QuestionImportInput>): String {
       return questionImportService.importBatch(question)
    }

    fun importBatchExcel(file: MultipartFile): String {
        if (file.isEmpty) {
            throw BusinessException(MessageConstant.FILE_NOT_EXIST)
        }
        val filename = file.originalFilename!!
        if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
            throw BusinessException(MessageConstant.FILE_FORMAT_ERROR)
        }
        // 解析文件
        val questions = ExcelUtil.parseExcelToQuestions(file)
        return questionImportService.importBatch(questions.map {
            QuestionImportInput(it.toEntity())
        })
    }

    fun generateQuestions(req: QuestionGenerateReq): List<QuestionGenerateDto>? {
        // 查询分类名
        val categoryDb = questionsRepository.sql.createQuery(Categories::class) {
            where(table.id eq req.categoryId)
            select(table.name)
        }.fetchFirstOrNull()
        if (categoryDb == null) {
            throw BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST)
        }

        return questionGenerateService.generateQuestions(
            category = categoryDb,
            count = req.count,
            difficulty = req.difficulty,
            type = req.types,
            includeMultiple = req.includeMultiple
        )
    }
}
