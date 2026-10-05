package com.yyjy.exam.entity.id;

import cn.hutool.core.util.IdUtil;
import org.babyfish.jimmer.sql.meta.UserIdGenerator;

/**
 * 雪花 id 生成器 —— Jimmer 的「用户自定义 id 策略」
 */
public class SnowflakeIdGenerator implements UserIdGenerator<Long> {
	
	@Override
	public Long generate(Class<?> entityType) {
		return IdUtil.getSnowflakeNextId();
	}
}
