package com.yyjy.exam.common.util;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Component
public class RedisUtil {

    private final StringRedisTemplate stringRedisTemplate;

    public RedisUtil(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public void set(String key, String value, Long expireSeconds) {
        if (expireSeconds == null) {
            stringRedisTemplate.opsForValue().set(key, value);
            return;
        }
        stringRedisTemplate.opsForValue().set(key, value, expireSeconds, TimeUnit.SECONDS);
    }

    public String get(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

    public void delete(String key) {
        stringRedisTemplate.delete(key);
    }

    public void delete(Collection<String> keys) {
        stringRedisTemplate.delete(keys);
    }

    public void expire(String key, long seconds) {
        stringRedisTemplate.expire(key, seconds, TimeUnit.SECONDS);
    }

    public Boolean exists(String key) {
        return stringRedisTemplate.hasKey(key);
    }

    public Set<String> keys(String pattern) {
        return stringRedisTemplate.keys(pattern);
    }

    public void deleteByPattern(String pattern) {
        Set<String> keys = stringRedisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            stringRedisTemplate.delete(keys);
        }
    }

    public void hSet(String key, String hashKey, String value) {
        stringRedisTemplate.opsForHash().put(key, hashKey, value);
    }

    public String hGet(String key, String hashKey) {
        Object val = stringRedisTemplate.opsForHash().get(key, hashKey);
        return val != null ? val.toString() : null;
    }

    public void hSetAll(String key, Map<String, String> map) {
        stringRedisTemplate.opsForHash().putAll(key, map);
    }

    public Map<Object, Object> hGetAll(String key) {
        return stringRedisTemplate.opsForHash().entries(key);
    }

    public void hDelete(String key, String... hashKey) {
        stringRedisTemplate.opsForHash().delete(key, (Object[]) hashKey);
    }

    public Boolean hHasKey(String key, String hashKey) {
        return stringRedisTemplate.opsForHash().hasKey(key, hashKey);
    }

    public Long lPush(String key, String value) {
        return stringRedisTemplate.opsForList().rightPush(key, value);
    }

    public Long lPush(String key, String value, long timeout) {
        Long count = stringRedisTemplate.opsForList().rightPush(key, value);
        expire(key, timeout);
        return count;
    }

    public Long lPushAll(String key, List<String> values) {
        return stringRedisTemplate.opsForList().rightPushAll(key, values);
    }

    public Long lPushAll(String key, List<String> values, long timeout) {
        Long count = stringRedisTemplate.opsForList().rightPushAll(key, values);
        expire(key, timeout);
        return count;
    }

    public List<String> lRange(String key, long start, long end) {
        return stringRedisTemplate.opsForList().range(key, start, end);
    }

    public Long lSize(String key) {
        return stringRedisTemplate.opsForList().size(key);
    }

    public String lIndex(String key, long index) {
        Object val = stringRedisTemplate.opsForList().index(key, index);
        return val != null ? val.toString() : null;
    }

    public Long lRemove(String key, long count, String value) {
        return stringRedisTemplate.opsForList().remove(key, count, value);
    }

    public Boolean zAdd(String key, String value, double score) {
        return stringRedisTemplate.opsForZSet().add(key, value, score);
    }

    public void zAdd(String key, Set<ZSetOperations.TypedTuple<String>> tuples) {
        stringRedisTemplate.opsForZSet().add(key, tuples);
    }

    public Double zIncrementScore(String key, String value, double delta) {
        return stringRedisTemplate.opsForZSet().incrementScore(key, value, delta);
    }

    public Double zScore(String key, String value) {
        return stringRedisTemplate.opsForZSet().score(key, value);
    }

    public Long zSize(String key) {
        return stringRedisTemplate.opsForZSet().size(key);
    }

    public Set<String> zRangeByScore(String key, double min, double max) {
        return stringRedisTemplate.opsForZSet().rangeByScore(key, min, max);
    }

    public Set<String> zReverseRange(String key, long start, long end) {
        return stringRedisTemplate.opsForZSet().reverseRange(key, start, end);
    }

    public Set<ZSetOperations.TypedTuple<String>> zReverseRangeWithScores(String key, long start, long end) {
        return stringRedisTemplate.opsForZSet().reverseRangeWithScores(key, start, end);
    }

    public Long zRemove(String key, String... values) {
        return stringRedisTemplate.opsForZSet().remove(key, (Object[]) values);
    }

    public <T> T executeScript(String script, String key, String... args) {
        DefaultRedisScript<T> redisScript = new DefaultRedisScript<>(script, (Class<T>) Long.class);
        return stringRedisTemplate.execute(redisScript, List.of(key), (Object[]) args);
    }
}
