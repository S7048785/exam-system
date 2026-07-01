package com.yyjy.models.dto

/**
 * @author Nyxcirea
 * @date 2026/5/2
 * @description: TODO
 */
data class QuestionTextGradingRequest(
    val recordId: Int,
    val title: String,
    val answer: String,
    val score: Int,
    val userAnswer: String,
)
