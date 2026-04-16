package com.yyjy.service

import com.yyjy.repository.ExamRecordsRepository
import org.springframework.stereotype.Service

@Service
class ExamRecordService(
    private val examRecordsRepository: ExamRecordsRepository
)
