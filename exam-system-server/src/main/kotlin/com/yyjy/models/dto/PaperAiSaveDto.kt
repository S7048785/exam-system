package com.yyjy.models.dto

data class PaperAiSaveDto(
    val name: String,
    val description: String,
    val duration: Int,
    val rules: List<PaperAiSaveDtoRule>
)

data class PaperAiSaveDtoRule(
    val type: String,
    val categoryIds: List<Long>,
    val count: Int,
    val score: Int
)