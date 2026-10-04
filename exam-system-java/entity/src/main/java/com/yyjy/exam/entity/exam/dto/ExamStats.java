package com.yyjy.exam.entity.exam.dto;

import lombok.Data;
import org.babyfish.jimmer.sql.TypedTuple;

@TypedTuple
@Data
public class ExamStats {
	private long paperId;
	private long submittedCount;
	private long gradingCount;
	private long gradedCount;
}
