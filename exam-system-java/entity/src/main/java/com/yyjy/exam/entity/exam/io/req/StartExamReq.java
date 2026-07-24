package com.yyjy.exam.entity.exam.io.req;

import jakarta.validation.constraints.NotNull;

public record StartExamReq(
		@NotNull int paperId,
		String studentName
) {
}
