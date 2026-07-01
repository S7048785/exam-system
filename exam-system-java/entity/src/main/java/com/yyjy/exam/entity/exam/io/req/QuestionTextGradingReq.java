package com.yyjy.exam.entity.exam.io.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuestionTextGradingReq(
    @NotNull int recordId,
    @NotBlank String title,
    @NotBlank String answer,
    @NotNull int score,
    @NotBlank String userAnswer
) {}
