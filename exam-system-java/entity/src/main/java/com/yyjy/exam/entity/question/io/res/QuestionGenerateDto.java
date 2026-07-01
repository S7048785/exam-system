package com.yyjy.exam.entity.question.io.res;

import java.util.List;

public record QuestionGenerateDto(
        String title,
        String type,
        boolean multi,
        String difficulty,
        int score,
        String analysis,
        List<String> choices,
        String answer
) {}
