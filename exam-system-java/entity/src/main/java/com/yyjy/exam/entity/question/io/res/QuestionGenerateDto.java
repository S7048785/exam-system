package com.yyjy.exam.entity.question.io.res;

import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;

import java.util.List;

public record QuestionGenerateDto(
		String title,
		QuestionType type,
		QuestionDifficulty difficulty,
		int score,
		String analysis,
		List<String> choices,
		String answer
) {
}
