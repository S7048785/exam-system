package com.yyjy.exam.entity.paper.io.req;

import jakarta.validation.constraints.Min;

import java.util.List;

public record PaperQuestionAddReq(
		List<Item> questions
) {
	public record Item(
			long questionId,
			@Min(value = 1, message = "分数不能小于1")
			int score
	) {
	}
}
