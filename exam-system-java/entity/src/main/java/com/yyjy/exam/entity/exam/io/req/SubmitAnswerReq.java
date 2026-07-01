package com.yyjy.exam.entity.exam.io.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubmitAnswerReq(
    @NotNull int questionId,
    @NotBlank String userAnswer
) {}
