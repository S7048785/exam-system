package com.yyjy.exam.entity.exam.io.req;

import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.lang.Nullable;

/**
 * 「试卷考试记录（成绩）列表」查询参数（控制台侧：试卷作者查看本卷全部考试记录）。
 * <p>
 * 口径与 {@code PaperListQuery} 一致：`page` / `size` 用包装类型 + `@NotNull`，
 * 缺参时才能被拦成 422（用基本类型拆箱会直接 NPE 报 500）。
 * <p>
 * ⚠️ 数值约束只能用 `@Min` / `@Max`；用 `@Size` 标 `Integer` 会触发 `HV000030`，导致全站请求 500。
 *
 * @param paperId 试卷 id（必填；只看自己名下的卷，归属校验在 Service）
 * @param name    考生姓名模糊查询（可空，空/空白视为不筛）
 * @param status  状态筛选（可空 = 全部）：考试中 / 待批改 / 已批改
 * @param passed  是否及格筛选（可空 = 全部）：true = 成绩 ≥ 及格分，false = 成绩 &lt; 及格分
 * @param page    页码，≥ 1
 * @param size    每页条数，1~100
 */
public record ExamRecordListQuery(
		@NotNull(message = "exam: 请填写试卷 id")
		Integer paperId,
		@Nullable
		String name,
		@Nullable
		ExamRecordStatus status,
		@Nullable
		Boolean passed,
		@NotNull(message = "exam: 请填写页码")
		@Min(value = 1, message = "exam: 页码不能小于 1")
		Integer page,
		@NotNull(message = "exam: 请填写每页条数")
		@Min(value = 1, message = "exam: 每页条数不能小于 1")
		@Max(value = 100, message = "exam: 每页条数不能大于 100")
		Integer size
) {
}
