package com.yyjy.exam.entity.exam.io.req;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 人工判卷请求体的**一条**（接口收的是它的数组，见 `POST /exams/grade`）。
 * <p>
 * 三件事由 Service 完成：校验得分范围 → 重算该场考试总分 → 推进 `exam_records.status`。
 * <p>
 * ⚠️ 得分的**上界**不在这里校验：它取决于「该题在这张卷上的配分」（`paper_question.score`，
 * 取不到回落 `questions.score`），要查库才知道，所以只能在 Service 里比对后抛 422。
 * 这里只拦「负数」这种与库无关的形态错误。
 *
 * @param answerRecordId 答题记录 id（`answer_record.id`）
 * @param correct        老师判定「答对了吗」。**与得分相互独立**：简答题可以「判错但给部分分」，
 *                       所以两个字段都要传，不互相推导
 * @param score          得分，下界 0（上界 = 该题在这张卷上的配分）
 */
public record GradeAnswerReq(
		@NotNull(message = "exam: 请填写答题记录 id")
		Long answerRecordId,
		@NotNull(message = "exam: 请填写是否正确")
		Boolean correct,
		@NotNull(message = "exam: 请填写得分")
		@Min(value = 0, message = "exam: 得分不能小于 0")
		Integer score
) {
}
