package com.yyjy.exam.entity.question.io.req;

import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;
import jakarta.validation.constraints.NotNull;

public record QuestionGenerateReq(
		@NotNull int count,
		QuestionType types,
		QuestionDifficulty difficulty,
		@NotNull Long categoryId,
		Boolean includeMultiple
) {
}
