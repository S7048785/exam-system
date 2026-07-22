package com.yyjy.exam.entity.user.entity;

import org.babyfish.jimmer.sql.EnumType;

@EnumType(EnumType.Strategy.NAME)
public enum UserStatus {
	ACTIVE, INACTIVE
}
