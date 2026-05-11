package com.yyjy.models.req

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Pattern

/**
 * @author Nyxcirea
 * @date 2026/4/9
 * @description: TODO
 */
@Schema(description = "题目列表请求参数")
data class QuestionListReq(
    val page: Int?,
    val size: Int?,
    val categoryId: Long?,
    @Schema(description = "难度: EASY, MEDIUM, HARD")
    @Pattern(regexp = "^(EASY|MEDIUM|HARD)$", message = "难度只能是 EASY, MEDIUM 或 HARD")
    val difficulty: String?,
    @Schema(description = "题目类型: CHOICE, JUDGE, TEXT")
    @Pattern(regexp = "^(CHOICE|JUDGE|TEXT)$", message = "题目类型只能是 CHOICE, JUDGE 或 TEXT")
    val type: String?,
    val keyword: String?
)