package com.yyjy.exam.entity.question.io.req;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record QuestionGenerateReq(
    @NotNull int count,
    @Pattern(regexp = "^(CHOICE|JUDGE|TEXT)$", message = "题目类型只能是 CHOICE, JUDGE 或 TEXT")
    String types,
    @Pattern(regexp = "^(EASY|MEDIUM|HARD)$", message = "难度只能是 EASY, MEDIUM 或 HARD")
    String difficulty,
    @NotNull Long categoryId,
    boolean includeMultiple
) {}
