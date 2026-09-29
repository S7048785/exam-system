package com.yyjy.exam.entity.id;

import cn.hutool.core.util.IdUtil;
import org.babyfish.jimmer.sql.meta.UserIdGenerator;

/**
 * 雪花 id 生成器 —— Jimmer 的「用户自定义 id 策略」，给
 * {@code @GeneratedValue(strategy = GenerationType.USER, generatorType = SnowflakeIdGenerator.class)} 用。
 * <p>
 * 标注了它的实体，id 在 INSERT 前由 Jimmer 调用 {@link #generate(Class)} 取值，
 * 库里那一列就不再需要自增（本项目的 `exam_records.id` 已改成 `bigint not null` 无自增）。
 * <p>
 * 直接用 Hutool 的雪花：{@link IdUtil#getSnowflakeNextId()} 内部是静态单例，
 * workerId / datacenterId 由本机标识推导，所以这里不必自己再持有 {@code Snowflake} 实例。
 * <p>
 * ⚠️ Jimmer 是拿**公开无参构造**反射实例化本类的（不走 Spring 容器，失败信息为
 * "it is not managed by IOC framework but does not support default constructor"），
 * 别把无参构造去掉，也别指望这里能注入依赖。
 */
public class SnowflakeIdGenerator implements UserIdGenerator<Long> {
	
	@Override
	public Long generate(Class<?> entityType) {
		return IdUtil.getSnowflakeNextId();
	}
}
