package com.yyjy.exam.entity.paper.io.req;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;

/**
 * 「试卷考试报表」列表查询参数（控制台：试卷维度 + 交卷 / 未评 / 已评统计列）。
 *
 * @param name       试卷名称模糊查询（可空，空 / 空白视为不筛）
 * @param categoryId 试卷分类（可空 = 全部分类）
 * @param startFrom  考试开始时间下界（含），可空
 * @param startTo    考试开始时间上界（含），可空
 * @param endFrom    考试结束时间下界（含），可空
 * @param endTo      考试结束时间上界（含），可空
 * @param page       页码，≥ 1
 * @param size       每页条数，10~50（与 {@link PaperListQuery} 一致）
 */
public record PaperReportListQuery(
		@Nullable
		String name,
		@Nullable
		Long categoryId,
		@Nullable
		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
		LocalDateTime startFrom,
		@Nullable
		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
		LocalDateTime startTo,
		@Nullable
		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
		LocalDateTime endFrom,
		@Nullable
		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
		LocalDateTime endTo,
		@NotNull(message = "paper: 请填写页码")
		@Min(value = 1, message = "paper: 页码不能小于 1")
		Integer page,
		@NotNull(message = "paper: 请填写每页条数")
		@Min(value = 10, message = "paper: 每页条数不能小于 10")
		@Max(value = 50, message = "paper: 每页条数不能大于 50")
		Integer size
) {
}
