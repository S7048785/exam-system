package com.yyjy.service

import com.yyjy.repository.NoticesRepository
import org.springframework.stereotype.Service

@Service
class NoticeService(
    private val noticesRepository: NoticesRepository
)
