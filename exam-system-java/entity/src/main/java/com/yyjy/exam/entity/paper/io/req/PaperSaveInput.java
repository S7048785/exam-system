package com.yyjy.exam.entity.paper.io.req;

import java.util.Map;

/**
 * @author Nyxcirea
 */
public record PaperSaveInput(
		String name,
		String description,
		int duration,
		Long categoryId,
		Map<String, Integer> questions
) {
}
