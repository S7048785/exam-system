package com.yyjy.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.yyjy.common.BusinessException
import com.yyjy.constants.MessageConstant
import com.yyjy.models.entity.dto.CategorySaveInput
import com.yyjy.models.entity.dto.QuestionImportInput
import com.yyjy.repository.CategoriesRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class QuestionServiceImportBatchTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var questionService: QuestionService

    @Autowired
    private lateinit var categoriesRepository: CategoriesRepository

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    private var testCategoryId: Long = 0

    @BeforeEach
    fun setup() {
        // 创建一个测试用分类，供各测试用例使用
        val saved = categoriesRepository.save(
            CategorySaveInput(
                name = "测试分类_importBatch",
                parentId = 0,
                sort = 99
            )
        )
        testCategoryId = saved.id
    }

    // -------------------------------------------------------------------------
    // 1. 空列表 → 抛出 BusinessException
    // -------------------------------------------------------------------------
    @Test
    fun `importBatch with empty list should throw BusinessException`() {
        val ex = assertThrows(BusinessException::class.java) {
            questionService.importBatch(emptyList())
        }
        assertEquals(MessageConstant.QUESTION_NOT_EMPTY, ex.message)
    }

    // -------------------------------------------------------------------------
    // 2. 通过 HTTP 接口传空列表 → 返回业务错误码 500
    // -------------------------------------------------------------------------
    @Test
    fun `POST batch import-questions with empty list should return error`() {
        mockMvc.perform(
            post("/question/batch/import-questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("[]")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.msg").value(MessageConstant.QUESTION_NOT_EMPTY))
    }

    // -------------------------------------------------------------------------
    // 3. 批量导入判断题 → 成功
    // -------------------------------------------------------------------------
    @Test
    fun `importBatch with judge questions should succeed`() {
        val questions = listOf(
            buildJudgeQuestion("判断题_批量_001", categoryId = testCategoryId),
            buildJudgeQuestion("判断题_批量_002", categoryId = testCategoryId)
        )
        assertDoesNotThrow { questionService.importBatch(questions) }
    }

    // -------------------------------------------------------------------------
    // 4. 批量导入选择题（含选项）→ 成功
    // -------------------------------------------------------------------------
    @Test
    fun `importBatch with choice questions should succeed`() {
        val questions = listOf(
            buildChoiceQuestion("选择题_批量_001", categoryId = testCategoryId),
            buildChoiceQuestion("选择题_批量_002", categoryId = testCategoryId)
        )
        assertDoesNotThrow { questionService.importBatch(questions) }
    }

    // -------------------------------------------------------------------------
    // 5. 混合题型（判断 + 选择）→ 成功
    // -------------------------------------------------------------------------
    @Test
    fun `importBatch with mixed question types should succeed`() {
        val questions = listOf(
            buildJudgeQuestion("混合_判断题_001", categoryId = testCategoryId),
            buildChoiceQuestion("混合_选择题_001", categoryId = testCategoryId)
        )
        assertDoesNotThrow { questionService.importBatch(questions) }
    }

    // -------------------------------------------------------------------------
    // 6. 分类不存在 → 抛出 BusinessException
    // -------------------------------------------------------------------------
    @Test
    fun `importBatch with non-existent categoryId should throw BusinessException`() {
        val questions = listOf(
            buildJudgeQuestion("不存在分类_判断题_001", categoryId = 999999L)
        )
        val ex = assertThrows(BusinessException::class.java) {
            questionService.importBatch(questions)
        }
        assertEquals(MessageConstant.QUESTION_CATEGORY_NOT_EXIST, ex.message)
    }

    // -------------------------------------------------------------------------
    // 7. 同类型同名题目重复 → 抛出 BusinessException
    // -------------------------------------------------------------------------
//    @Test
//    fun `importBatch with duplicate title in same type should throw BusinessException`() {
//        val title = "重复判断题_批量_001"
//        // 先导入一次
//        questionService.importBatch(listOf(buildJudgeQuestion(title, categoryId = testCategoryId)))
//
//        // 再次导入同名同类型题目
//        val ex = assertThrows(BusinessException::class.java) {
//            questionService.importBatch(listOf(buildJudgeQuestion(title, categoryId = testCategoryId)))
//        }
//        assertEquals("同类型下已存在同名题目", ex.message)
//    }

    // -------------------------------------------------------------------------
    // 8. 通过 HTTP 接口批量导入判断题 → 返回 200
    // -------------------------------------------------------------------------
    @Test
    fun `POST batch import-questions with valid judge questions should return ok`() {
        val body = objectMapper.writeValueAsString(
            listOf(
                mapOf(
                    "title" to "HTTP接口_判断题_001",
                    "type" to "JUDGE",
                    "multi" to false,
                    "categoryId" to testCategoryId,
                    "difficulty" to "EASY",
                    "score" to 2,
                    "analysis" to "这是一道判断题",
                    "answer" to "true"
                )
            )
        )
        mockMvc.perform(
            post("/question/batch/import-questions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value(200))
    }

    // =========================================================================
    // 辅助构建方法
    // =========================================================================

    private fun buildJudgeQuestion(
        title: String,
        categoryId: Long,
        answer: String = "true"
    ): QuestionImportInput {
        return QuestionImportInput(
            title = title,
            type = "JUDGE",
            multi = false,
            categoryId = categoryId,
            difficulty = "EASY",
            score = 2,
            analysis = "这是一道判断题",
            answer = answer,
            keywords = null,
            choices = null
        )
    }

    private fun buildChoiceQuestion(
        title: String,
        categoryId: Long
    ): QuestionImportInput {
        return QuestionImportInput(
            title = title,
            type = "CHOICE",
            multi = false,
            categoryId = categoryId,
            difficulty = "MEDIUM",
            score = 5,
            analysis = "这是一道选择题",
            answer = "A",
            keywords = null,
            choices = listOf(
                QuestionImportInput.TargetOf_choices(content = "选项A", correct = true, sort = 0),
                QuestionImportInput.TargetOf_choices(content = "选项B", correct = false, sort = 1),
                QuestionImportInput.TargetOf_choices(content = "选项C", correct = false, sort = 2),
                QuestionImportInput.TargetOf_choices(content = "选项D", correct = false, sort = 3)
            )
        )
    }
}
