package com.yyjy.models.dto

data class StartExamDto(
    val paperId: Int,
    val studentName: String
)

data class SubmitAnswerDto(
    val questionId: Int,
    val userAnswer: String
)