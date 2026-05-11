package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.entity.ExamRecords
import com.yyjy.service.ExamRecordService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "考试记录模块")
@RequestMapping("/exam-record")
@RestController
class ExamRecordController(
    private val examRecordService: ExamRecordService,
) {

    @Operation(summary = "新增考试记录")
    @PostMapping("/add")
    fun addExamRecord(@RequestBody examRecord: ExamRecords): R<String?> {
        return R.ok()
    }

    @Operation(summary = "更新考试记录")
    @PutMapping("/update/{id}")
    fun updateExamRecord(@PathVariable id: Long, @RequestBody examRecord: ExamRecords): R<String?> {
        return R.ok()
    }

    @Operation(summary = "删除考试记录")
    @DeleteMapping("/remove/{id}")
    fun removeExamRecord(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "获取考试记录")
    @GetMapping("/{id}")
    fun getExamRecord(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "考试记录列表")
    @GetMapping("/list")
    fun listExamRecords(): R<String?> {
        return R.ok()
    }
}
