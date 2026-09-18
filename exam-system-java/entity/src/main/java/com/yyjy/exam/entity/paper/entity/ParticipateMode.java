package com.yyjy.exam.entity.paper.entity;

import org.babyfish.jimmer.sql.EnumType;

/**
 * 考生参与方式（`paper.participate_mode`）。
 * <p>
 * ⚠️ 目前只做**存储与展示**，还没有在开考接口上执行 —— 见 HANDOFF 4.10：
 * 要执行就必须摘掉 `ExamController.startExam` 的 `@SaCheckLogin`，
 * 而那一刻 Q7（`GET /exams/{id}/detail` 泄露全套答案且可枚举）会从「需登录」变成「完全匿名可利用」。
 * 必须先修 Q7。
 */
@EnumType(EnumType.Strategy.NAME)
public enum ParticipateMode {
	/**
	 * 免登录考试：任何人都能开考，成绩只记手填的考生姓名。
	 */
	ANONYMOUS,
	/**
	 * 账号登录考试：必须登录才能开考（**当前实际生效的唯一取值**）。
	 */
	LOGIN_REQUIRED
}
