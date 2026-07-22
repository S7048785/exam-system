package com.yyjy.exam.entity.question.io.req;

import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;
import org.springframework.lang.Nullable;

public record QuestionListReq(
		Integer page,
		Integer size,
		Long categoryId,
		@Nullable
		QuestionDifficulty difficulty,
		@Nullable
		QuestionType type // MethodArgumentTypeMismatchException
) {
}
