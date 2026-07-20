package com.yyjy.exam.entity.paper.io.req;

public record PaperSaveInput(
		String name,
		String description,
		int duration,
		Long categoryId
) {
}
