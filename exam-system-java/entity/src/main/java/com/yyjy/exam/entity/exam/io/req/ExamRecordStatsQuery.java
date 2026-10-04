package com.yyjy.exam.entity.exam.io.req;

import jakarta.validation.constraints.NotNull;

/**
 * 「试卷成绩统计」查询参数（控制台侧）。
 * <p>
 * 只有 `paperId`：统计是**整卷**口径，与列表的姓名筛选无关，也不分页。
 * <p>
 * 用包装类型 + `@NotNull`（与 {@code ExamRecordListQuery} 同款）：
 * 缺参时才能被拦成 422；若写成 `@RequestParam int`，缺参会落进兜底变 500。
 */
public record ExamRecordStatsQuery(
		@NotNull(message = "exam: 请填写试卷 id")
		Integer paperId
) {
}
