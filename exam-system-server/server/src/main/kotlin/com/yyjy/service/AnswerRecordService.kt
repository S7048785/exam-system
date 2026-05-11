package com.yyjy.service

import com.yyjy.repository.AnswerRecordRepository
import org.springframework.stereotype.Service

@Service
class AnswerRecordService(
    private val answerRecordRepository: AnswerRecordRepository
)
