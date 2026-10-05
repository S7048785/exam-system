package com.yyjy.exam.entity.exam.dto;

import lombok.Data;
import org.babyfish.jimmer.sql.TypedTuple;

import java.time.LocalDateTime;

@TypedTuple
@Data
public class PaperReport {  // ← 你自己定义的名字
	private final String paperName;
	private final LocalDateTime start;
	private final LocalDateTime end;
	private final int totalScore;
	private final int passingScore;
	private final long submittedCount;
	private final long gradingCount;
	private final long gradedCount;
}