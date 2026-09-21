package com.yyjy.exam.entity.question.io.req;

import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;
import org.springframework.lang.Nullable;

public record QuestionListReq(
		Integer page,
		Integer size,
		Long categoryId,
		@Nullable
		String keyword, // 题干模糊搜索（2026-09-20 补：前端搜索框一直在，后端之前没收这个字段）
		@Nullable
		QuestionDifficulty difficulty,
		@Nullable
		QuestionType type // MethodArgumentTypeMismatchException
) {
}
