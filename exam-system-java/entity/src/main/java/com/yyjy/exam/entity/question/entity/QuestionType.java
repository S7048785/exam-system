package com.yyjy.exam.entity.question.entity;

import org.babyfish.jimmer.sql.EnumType;

@EnumType(EnumType.Strategy.NAME)
public enum QuestionType {
	SINGLE_CHOICE,
	MULTIPLE_CHOICE,
	JUDGE,
	TEXT;
}
