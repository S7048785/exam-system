package com.yyjy.exam.entity.paper.io.req;

import com.yyjy.exam.common.constant.MessageConstant;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * 整体替换试卷的题目集（配合 {@code PUT /paper/{id}/questions}）。
 */
public record PaperQuestionsUpdateReq(
		@NotEmpty(message = MessageConstant.PAPER_QUESTION_EMPTY)
		List<@Valid Item> questions
) {
	public record Item(
			long questionId,
			@Min(value = 1, message = "分数不能小于1")
			int score
	) {
	}
}
