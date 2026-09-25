package com.yyjy.exam.entity.exam.io.req;

import com.yyjy.exam.entity.constant.ValidationMessage;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 开考请求。
 * <p>
 * `studentName` 的口径（2026-09-25 用户拍板）：**可以为 null** —— 账号登录考试的考生姓名
 * 取账号里的 `realName`，请求体不用传；免登录考试必须传，且长度 1~50
 * （对齐 `exam_records.student_name varchar(50)`）。
 * <p>
 * `@Size` 对 null 是放行的，所以「可空 + 有值时限长」正好用它表达。
 * ⚠️ 空串（`""`）长度 0，会被拦下 —— 不传就传 null，**别传空串**。
 */
public record StartExamReq(
		@NotNull int paperId,
		@Size(min = 1, max = 50, message = ValidationMessage.EXAM_STUDENT_NAME_INVALID)
		String studentName
) {
}
