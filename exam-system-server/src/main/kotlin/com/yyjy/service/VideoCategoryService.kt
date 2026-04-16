package com.yyjy.service

import com.yyjy.repository.VideoCategoriesRepository
import org.springframework.stereotype.Service

@Service
class VideoCategoryService(
    private val videoCategoriesRepository: VideoCategoriesRepository
)
