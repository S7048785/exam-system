package com.yyjy.exam.entity.paper.io.req;

import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.entity.paper.entity.ParticipateMode;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;
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
		/* 考试开始时间（`paper.start`，NOT NULL） */
		LocalDateTime start,
		/* 考试截止时间（`paper.end`，NOT NULL） */
		LocalDateTime end,
		/* 考生参与方式（免登录 / 账号登录） */
		ParticipateMode participateMode,
		@Min(value = 1, message = MessageConstant.PAPER_MAX_ATTEMPTS_INVALID)
		Integer maxAttempts,
		Map<String, Integer> questions
) {
}
