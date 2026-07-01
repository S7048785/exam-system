package com.yyjy.exam.entity.question.io.req;

import jakarta.validation.constraints.Pattern;

public record QuestionListReq(
    Integer page,
    Integer size,
    Long categoryId,
    @Pattern(regexp = "^(EASY|MEDIUM|HARD)$", message = "难度只能是 EASY, MEDIUM 或 HARD")
    String difficulty,
    @Pattern(regexp = "^(CHOICE|JUDGE|TEXT)$", message = "题目类型只能是 CHOICE, JUDGE 或 TEXT")
    String type,
    String keyword
) {}
