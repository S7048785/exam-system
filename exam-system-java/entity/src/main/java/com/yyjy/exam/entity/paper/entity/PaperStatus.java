package com.yyjy.exam.entity.paper.entity;

import org.babyfish.jimmer.sql.EnumType;

/**
 * @author Nyxcirea
 * @date 2026/7/15
 * @description: TODO
 */
@EnumType(EnumType.Strategy.NAME)
public enum PaperStatus {
	DRAFT,
	PUBLISHED,
	STOPPED
}
