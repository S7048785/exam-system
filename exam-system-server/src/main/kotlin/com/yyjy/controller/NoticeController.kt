package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.entity.Notices
import com.yyjy.service.NoticeService
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

@Tag(name = "公告模块")
@RequestMapping("/notice")
@RestController
class NoticeController(
    private val noticeService: NoticeService,
) {

    @Operation(summary = "新增公告")
    @PostMapping("/add")
    fun addNotice(@RequestBody notice: Notices): R<String?> {
        return R.ok()
    }

    @Operation(summary = "更新公告")
    @PutMapping("/update/{id}")
    fun updateNotice(@PathVariable id: Long, @RequestBody notice: Notices): R<String?> {
        return R.ok()
    }

    @Operation(summary = "删除公告")
    @DeleteMapping("/remove/{id}")
    fun removeNotice(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "获取公告")
    @GetMapping("/{id}")
    fun getNotice(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "公告列表")
    @GetMapping("/list")
    fun listNotices(): R<String?> {
        return R.ok()
    }
}
