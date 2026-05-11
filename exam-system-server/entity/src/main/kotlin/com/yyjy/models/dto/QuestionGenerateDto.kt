package com.yyjy.models.dto

/**
 * @author Nyxcirea
 * @date 2026/4/13
 */
data class QuestionGenerateDto(
    val title: String,
    val type: String,
    val multi: Boolean,
    val difficulty: String,
    val score: Int,
    val analysis: String?,
    val choices: List<String>?,
    val answer: String
)
