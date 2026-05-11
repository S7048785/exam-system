package com.yyjy.models.req

import jakarta.validation.constraints.Pattern

/**
 * @author Nyxcirea
 * @date 2026/4/12
 * @description: TODO
 */
data class QuestionGenerateReq(
    val count: Int,
    @Pattern(regexp = "^(CHOICE|JUDGE|TEXT)$", message = "题目类型只能是 CHOICE, JUDGE 或 TEXT")
    val types: String,
    @Pattern(regexp = "^(EASY|MEDIUM|HARD)$", message = "难度只能是 EASY, MEDIUM 或 HARD")
    val difficulty: String,
    val categoryId: Long,
    val includeMultiple: Boolean,
//    val requirements: String
)
