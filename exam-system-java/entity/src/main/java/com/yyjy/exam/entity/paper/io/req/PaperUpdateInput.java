package com.yyjy.exam.entity.paper.io.req;

import java.util.Map;

/**
 * @author Nyxcirea
 */
public record PaperUpdateInput(
		int id,
		String name,
		String description,
		int duration,
		Map<String, Integer> questions
) {
}
