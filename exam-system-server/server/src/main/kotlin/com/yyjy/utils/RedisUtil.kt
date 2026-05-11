package com.yyjy.utils

import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.core.ZSetOperations
import org.springframework.stereotype.Component
import java.util.concurrent.TimeUnit


/**
 * @author Nyxcirea
 * @date 2026/4/10
 * @description: TODO
 */
@Component
class RedisUtil(
    private val redisTemplate: RedisTemplate<String, Any>
) {

    // 设置缓存、设置过期时间
    fun set(key: String, value: Any, expireSeconds: Long?) {
        if (expireSeconds == null) {
            redisTemplate.opsForValue().set(key, value)
            return
        }
        redisTemplate.opsForValue().set(key, value, expireSeconds, TimeUnit.SECONDS)
    }

    // 获取缓存
    fun get(key: String): Any? {
        return redisTemplate.opsForValue().get(key)
    }

    // 删除缓存
    fun delete(key: String) {
        redisTemplate.delete(key)
    }

    // 批量删除缓存
    fun delete(keys: Collection<String>) {
        redisTemplate.delete(keys)
    }

    // 设置过期时间
    fun expire(key: String, seconds: Long) {
        redisTemplate.expire(key, seconds, TimeUnit.SECONDS)
    }

    // 判断key是否存在缓存
    fun exists(key: String): Boolean {
        return redisTemplate.hasKey(key)
    }

    /**
     * 根据前缀获取所有匹配的key
     * @param pattern key前缀
     * @return 匹配的key集合
     */
    fun keys(pattern: String): Set<String> {
        return redisTemplate.keys(pattern)
    }

    /**
     * 根据前缀删除所有匹配的key
     * @param pattern key前缀
     */
    fun deleteByPattern(pattern: String) {
        val keys = redisTemplate.keys(pattern)
        if (keys.isNotEmpty()) {
            redisTemplate.delete(keys)
        }
    }

    /**
     * 设置Hash缓存
     * @param key 缓存键
     * @param hashKey Hash键
     * @param value Hash值
     */
    fun hSet(key: String, hashKey: String, value: Any) {
        redisTemplate.opsForHash<String, Any>().put(key, hashKey, value)
    }

    /**
     * 获取Hash缓存
     * @param key 缓存键
     * @param hashKey Hash键
     * @return Hash值
     */
    fun hGet(key: String, hashKey: String): Any? {
        return redisTemplate.opsForHash<String, Any>().get(key, hashKey)
    }

    /**
     * 设置整个Hash缓存
     * @param key 缓存键
     * @param map Hash表
     */
    fun hSetAll(key: String, map: Map<String?, Any?>) {
        redisTemplate.opsForHash<String, Any>().putAll(key, map)
    }

    /**
     * 获取整个Hash缓存
     * @param key 缓存键
     * @return Hash表
     */
    fun hGetAll(key: String): Map<String, Any> {
        return redisTemplate.opsForHash<String, Any>().entries(key)
    }

    /**
     * 删除Hash缓存中的某个键
     * @param key 缓存键
     * @param hashKey Hash键
     */
    fun hDelete(key: String, vararg hashKey: String?) {
        redisTemplate.opsForHash<String, Any>().delete(key, *hashKey)
    }

    /**
     * 判断Hash缓存中是否存在某个键
     * @param key 缓存键
     * @param hashKey Hash键
     * @return 是否存在
     */
    fun hHasKey(key: String, hashKey: String): Boolean {
        return redisTemplate.opsForHash<String, Any>().hasKey(key, hashKey)
    }

    /**
     * 将列表放入缓存
     * @param key 缓存键
     * @param value 列表值
     * @return 列表长度
     */
    fun lPush(key: String, value: Any): Long? {
        return redisTemplate.opsForList().rightPush(key, value)
    }

    /**
     * 将列表放入缓存
     * @param key 缓存键
     * @param value 列表值
     * @param timeout 过期时间（秒）
     * @return 列表长度
     */
    fun lPush(key: String, value: Any, timeout: Long): Long? {
        val count = redisTemplate.opsForList().rightPush(key, value)
        expire(key, timeout)
        return count
    }

    /**
     * 将多个值放入列表缓存
     * @param key 缓存键
     * @param values 值列表
     * @return 列表长度
     */
    fun lPushAll(key: String, values: List<Any?>): Long? {
        return redisTemplate.opsForList().rightPushAll(key, values)
    }

    /**
     * 将多个值放入列表缓存并设置过期时间
     * @param key 缓存键
     * @param values 值列表
     * @param timeout 过期时间（秒）
     * @return 列表长度
     */
    fun lPushAll(key: String, values: List<Any?>, timeout: Long): Long? {
        val count = redisTemplate.opsForList().rightPushAll(key, values)
        expire(key, timeout)
        return count
    }

    /**
     * 获取列表缓存
     * @param key 缓存键
     * @param start 开始索引
     * @param end 结束索引
     * @return 列表
     */
    fun lRange(key: String, start: Long, end: Long): List<Any>? {
        return redisTemplate.opsForList().range(key, start, end)
    }

    /**
     * 获取列表长度
     * @param key 缓存键
     * @return 列表长度
     */
    fun lSize(key: String): Long? {
        return redisTemplate.opsForList().size(key)
    }

    /**
     * 获取列表中指定索引的值
     * @param key 缓存键
     * @param index 索引
     * @return 值
     */
    fun lIndex(key: String, index: Long): Any? {
        return redisTemplate.opsForList().index(key, index)
    }

    /**
     * 移除列表中的值
     * @param key 缓存键
     * @param count 移除数量
     * @param value 值
     * @return 移除数量
     */
    fun lRemove(key: String, count: Long, value: Any): Long? {
        return redisTemplate.opsForList().remove(key, count, value)
    }

    /**
     * 向有序集合添加元素，如果已存在则更新分数
     * @param key 缓存键
     * @param value 值
     * @param score 分数
     * @return 是否成功
     */
    fun zAdd(key: String, value: Any, score: Double): Boolean? {
        return redisTemplate.opsForZSet().add(key, value, score)
    }



    fun zAdd(key: String, value: Set<ZSetOperations.TypedTuple<Any>>) {
        redisTemplate.opsForZSet().add(key, value)
    }



    /**
     * 增加有序集合中元素的分数
     * @param key 缓存键
     * @param value 值
     * @param delta 增加的分数
     * @return 新的分数
     */
    fun zIncrementScore(key: String, value: Any, delta: Double): Double? {
        return redisTemplate.opsForZSet().incrementScore(key, value, delta)
    }

    /**
     * 获取有序集合中元素的分数
     * @param key 缓存键
     * @param value 值
     * @return 分数
     */
    fun zScore(key: String, value: Any): Double? {
        return redisTemplate.opsForZSet().score(key, value)
    }

    /**
     * 获取有序集合的大小
     * @param key 缓存键
     * @return 集合大小
     */
    fun zSize(key: String): Long? {
        return redisTemplate.opsForZSet().size(key)
    }

    /**
     * 获取有序集合中指定分数范围的元素
     * @param key 缓存键
     * @param min 最小分数
     * @param max 最大分数
     * @return 元素集合
     */
    fun zRangeByScore(key: String, min: Double, max: Double): Set<Any>? {
        return redisTemplate.opsForZSet().rangeByScore(key, min, max)
    }

    /**
     * 获取有序集合中指定排名范围的元素（从高到低）
     * @param key 缓存键
     * @param start 开始排名（0表示第一个）
     * @param end 结束排名
     * @return 元素集合
     */
    fun zReverseRange(key: String, start: Long, end: Long): Set<Any>? {
        return redisTemplate.opsForZSet().reverseRange(key, start, end)
    }

    /**
     * 获取有序集合中指定排名范围的元素和分数（从高到低）
     * @param key 缓存键
     * @param start 开始排名（0表示第一个）
     * @param end 结束排名
     * @return 元素和分数的集合
     */
    fun zReverseRangeWithScores(key: String, start: Long, end: Long): Set<ZSetOperations.TypedTuple<Any>>? {
        return redisTemplate.opsForZSet().reverseRangeWithScores(key, start, end)
    }

    /**
     * 移除有序集合中的元素
     * @param key 缓存键
     * @param values 要移除的元素
     * @return 移除的数量
     */
    fun zRemove(key: String, vararg values: Any?): Long? {
        return redisTemplate.opsForZSet().remove(key, *values)
    }


}