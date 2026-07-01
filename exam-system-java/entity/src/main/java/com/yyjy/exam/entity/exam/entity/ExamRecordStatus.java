package com.yyjy.exam.entity.exam.entity;

import org.babyfish.jimmer.sql.EnumType;

@EnumType(EnumType.Strategy.NAME)
public enum ExamRecordStatus {
    ONGOING,
    SUBMITTED,
    GRADED
}
