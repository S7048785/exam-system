package com.yyjy.exam.common.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Redisson 客户端配置
 * 与 Spring Data Redis 共用同一 Redis 实例，互不冲突
 */
@Configuration
public class RedissonConfig {

	@Value("${exam.redis.host}")
	private String host;

	@Value("${exam.redis.port}")
	private int port;

	@Value("${exam.redis.database}")
	private int database;

	@Bean(destroyMethod = "shutdown")
	public RedissonClient redissonClient() {
		Config config = new Config();
		config.useSingleServer()
				.setAddress("redis://" + host + ":" + port)
				.setDatabase(database)
				.setConnectionMinimumIdleSize(1)
				.setConnectionPoolSize(4);
		return Redisson.create(config);
	}
}
