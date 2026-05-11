package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.dto.StartExamDto
import com.yyjy.models.dto.SubmitAnswerDto
import com.yyjy.models.entity.dto.ExamRecordDetail
import com.yyjy.models.entity.dto.ExamStartView
import com.yyjy.service.ExamRecordService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.babyfish.jimmer.client.meta.Api
import org.springframework.web.bind.annotation.*

@Api
@Tag(name = "考试管理", description = "考试流程相关操作，包括开始考试、答题提交、AI批阅、成绩查询等功能")
@RequestMapping("/exams")
@RestController
class ExamController(
    private val examRecordService: ExamRecordService
) {

    @Api
    @Operation(summary = "开始考试")
    @PostMapping("/start")
    fun startExam(@RequestBody req: StartExamDto): R<ExamStartView> {
        return R.ok(examRecordService.startExam(req.paperId, req.studentName))
    }

    @Operation(summary = "查询考试记录详情")
    @GetMapping("/{id}")
    fun getExamRecord(@PathVariable id: Int): R<ExamRecordDetail> {
        return R.ok(examRecordService.getExamRecord(id))
    }

    @Operation(summary = "提交考试答案")
    @PostMapping("/submit/{examRecordId}")
    suspend fun submitAnswers(
        @PathVariable examRecordId: Int,
        @RequestBody answers: List<SubmitAnswerDto>
    ): R<String?> {
        examRecordService.submitAnswers(examRecordId, answers)
        return R.ok(msg="答案已提交")
    }
}