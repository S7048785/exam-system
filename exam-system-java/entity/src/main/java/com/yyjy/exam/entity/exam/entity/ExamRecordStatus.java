package com.yyjy.exam.entity.exam.entity;

import org.babyfish.jimmer.sql.EnumType;

@EnumType(EnumType.Strategy.NAME)
public enum ExamRecordStatus {
	// 进行中
	ONGOING,
	// 待批改
	GRADING,
	// 已批改
	GRADED
}
