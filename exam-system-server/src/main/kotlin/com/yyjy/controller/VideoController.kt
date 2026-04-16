package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.entity.Videos
import com.yyjy.service.VideoService
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

@Tag(name = "视频模块")
@RequestMapping("/video")
@RestController
class VideoController(
    private val videoService: VideoService,
) {

    @Operation(summary = "新增视频")
    @PostMapping("/add")
    fun addVideo(@RequestBody video: Videos): R<String?> {
        return R.ok()
    }

    @Operation(summary = "更新视频")
    @PutMapping("/update/{id}")
    fun updateVideo(@PathVariable id: Long, @RequestBody video: Videos): R<String?> {
        return R.ok()
    }

    @Operation(summary = "删除视频")
    @DeleteMapping("/remove/{id}")
    fun removeVideo(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "获取视频")
    @GetMapping("/{id}")
    fun getVideo(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "视频列表")
    @GetMapping("/list")
    fun listVideos(): R<String?> {
        return R.ok()
    }
}
