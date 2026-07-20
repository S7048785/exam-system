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
		Long categoryId,
		Map<String, Integer> questions
) {
	public PaperUpdateInput {
		// 1. 基础空值校验
		if (questions == null) {
			throw new IllegalArgumentException("题目列表不能为空");
		}
		// 2. 遍历校验每个分值必须 >= 1
		for (Integer value : questions.values()) {
			if (value == null || value < 1) {
				throw new IllegalArgumentException("每个题目的分值必须 >= 1，当前错误值：" + value);
			}
		}
		// 3. 如果有其他业务校验（比如 duration > 0）也可以写在这里
		if (duration <= 0) {
			throw new IllegalArgumentException("考试时长必须大于0");
		}
	}
}
