package com.yyjy.service

import com.yyjy.repository.VideosRepository
import org.springframework.stereotype.Service

@Service
class VideoService(
    private val videosRepository: VideosRepository
)
