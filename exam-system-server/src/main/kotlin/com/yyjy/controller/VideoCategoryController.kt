package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.entity.VideoCategories
import com.yyjy.service.VideoCategoryService
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

@Tag(name = "视频分类模块")
@RequestMapping("/video-category")
@RestController
class VideoCategoryController(
    private val videoCategoryService: VideoCategoryService,
) {

    @Operation(summary = "新增视频分类")
    @PostMapping("/add")
    fun addVideoCategory(@RequestBody videoCategory: VideoCategories): R<String?> {
        return R.ok()
    }

    @Operation(summary = "更新视频分类")
    @PutMapping("/update/{id}")
    fun updateVideoCategory(@PathVariable id: Long, @RequestBody videoCategory: VideoCategories): R<String?> {
        return R.ok()
    }

    @Operation(summary = "删除视频分类")
    @DeleteMapping("/remove/{id}")
    fun removeVideoCategory(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "获取视频分类")
    @GetMapping("/{id}")
    fun getVideoCategory(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "视频分类列表")
    @GetMapping("/list")
    fun listVideoCategories(): R<String?> {
        return R.ok()
    }
}
