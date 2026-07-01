package com.yyjy.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer
import org.springframework.data.redis.serializer.StringRedisSerializer

/**
 * @author Nyxcirea
 * @date 2026/4/10
 * @description: TODO
 */
@Configuration
class RedisConfig {

    @Bean
    fun redisTemplate(connectionFactory: RedisConnectionFactory): RedisTemplate<String, Any> {
        val template = RedisTemplate<String, Any>()
        template.connectionFactory = connectionFactory

        // 设置key的序列化方式
        template.keySerializer = StringRedisSerializer()
        // 设置value的序列化方式
        template.valueSerializer = GenericJackson2JsonRedisSerializer()

        // 设置hash key的序列化方式
        template.hashKeySerializer = StringRedisSerializer()
        // 设置hash value的序列化方式
        template.hashValueSerializer = GenericJackson2JsonRedisSerializer()

        template.afterPropertiesSet()
        return template
    }
}