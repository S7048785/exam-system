package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.dto.QuestionGenerateDto
import com.yyjy.models.entity.Questions
import com.yyjy.models.entity.dto.*
import com.yyjy.models.req.QuestionGenerateReq
import com.yyjy.models.req.QuestionListReq
import com.yyjy.models.res.QuestionPageRes
import com.yyjy.repository.QuestionsRepository
import com.yyjy.service.QuestionService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletResponse
import org.babyfish.jimmer.client.meta.Api
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@Api
@Tag(name = "题目模块")
@RequestMapping("/question")
@RestController
class QuestionController(
    private val questionService: QuestionService,
    private val questionRepository: QuestionsRepository
) {

    @Api
    @Operation(summary = "新增题目", description = "添加新的考试题目，支持选择题、判断题、简答题等多种题型")
    @PostMapping("/add")
    fun addQuestion(@RequestBody question: QuestionSaveInput): R<Questions> {

        return R.ok(questionService.save(question))
    }

    @Api
    @Operation(summary = "更新题目")
    @PutMapping("/update")
    fun updateQuestion(@RequestBody question: QuestionUpdateInput): R<Questions> {
        return R.ok(questionService.update(question))
    }

    @Api
    @Operation(summary = "删除题目")
    @DeleteMapping("/remove/{id}")
    fun removeQuestion(@PathVariable id: Long): R<String?> {
        questionService.remove(id)
        return R.ok()
    }

    @Api
    @Operation(summary = "获取题目", description = "获取指定ID的题目完整信息，包括题目内容、选项、答案等详细数据")
    @GetMapping("/{id}")
    fun getQuestion(@PathVariable id: Long): R<QuestionsPageView?> {
        val question = questionService.getById(id)
        return R.ok(question)
    }

    @Api
    @Operation(
        summary = "题目列表",
        description = "根据传入的多个筛选条件，返回分页后的题目列表。结果中需包含题目的选项和答案等详细信息。"
    )
    @GetMapping("/list")
    fun listQuestions(@Validated req: QuestionListReq): R<QuestionPageRes> {

        val questions: QuestionPageRes = questionService.list(req)

        return R.ok(questions)
    }

    @Api
    @Operation(summary = "获取热门题目", description = "获取访问次数最多的热门题目，用于首页推荐展示")
    @GetMapping("/popular")
    fun getPopularQuestions(size: Int = 10): R<List<QuestionsPageView>> {
        return R.ok(questionService.getPopularQuestions(size))
    }

    @Api
    @Operation(summary = "热门题目缓存初始化、数据重置")
    @PostMapping("/popular/refresh")
    fun refreshQuestions(): R<List<QuestionsPageView>> {
        questionService.refreshPopularQuestions()
        return R.ok()
    }

    @Api
    @Operation(summary = "下载Excel导入模板", description = "获取标准模板文件")
    @GetMapping("/batch/template")
    fun downloadTemplate(response: HttpServletResponse) {
        questionService.exportTemplate(response)
    }

    @Api
    @Operation(summary = "预览Excel文件内容", description = "解析但不入库")
    @PostMapping("/batch/preview-excel")
    fun previewExcel(// 强烈推荐使用 @RequestPart 而不是 @RequestParam
        @RequestPart("file")
        @Parameter(description = "要上传的文件", required = true)
        file: MultipartFile
    ): R<List<QuestionImportView>> {
        return R.ok(questionService.parseExcel(file))
    }

    @Api
    @Operation(summary = "AI智能生成题目", description = "根据指定主题和要求智能生成题目，支持预览后再决定是否导入")
    @PostMapping("/batch/ai-generate")
    fun aiGenerate(@RequestBody req: QuestionGenerateReq): R<List<QuestionGenerateDto>?> {

        return R.ok(questionService.generateQuestions(req))
    }

    @Api
    @Operation(
        summary = "批量导入题目",
        description = "将题目列表批量导入到数据库，支持Excel解析后的导入或AI生成后的确认导入"
    )
    @PostMapping("/batch/import-questions")
    fun importQuestions(@RequestBody question: List<QuestionImportInput>): R<String?> {
        return R.ok(questionService.importBatch(question))
    }

    @Api
    @Operation(summary = "Excel批量导入题目", description = "解析Excel文件并将题目批量导入到数据库")
    @PostMapping("/batch/excel-import-questions")
    fun importExcelQuestions(
        @RequestPart("file")
        @Parameter(description = "要上传的文件", required = true)
        file: MultipartFile
    ): R<String?> {
        return R.ok(questionService.importBatchExcel(file))
    }
}
