package com.yyjy.exam.entity.paper.io.req;

import com.yyjy.exam.entity.paper.entity.PaperStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.lang.Nullable;

/**
 * 「我的试卷」列表查询参数。
 * <p>
 * 2026-09-23：由 Jimmer DTO（`specification PaperListQuery`）改为普通 record。
 * `page` / `size` 刻意用包装类型 Integer，缺参时才能被 @NotNull 拦成 422
 * （原来用查询走 `int` 拆箱会直接 NPE 报 500）。
 */
public record PaperListQuery(
		@Nullable
		String name,
		@Nullable
		Long categoryId,
		@NotNull(message = "paper: 请填写页码")
		@Min(value = 1, message = "paper: 页码不能小于 1")
		Integer page,
		@NotNull(message = "paper: 请填写每页条数")
		@Min(value = 10, message = "paper: 每页条数不能小于 10")
		@Max(value = 50, message = "paper: 每页条数不能大于 50")
		Integer size,
		@Nullable
		PaperStatus status
) {
}
