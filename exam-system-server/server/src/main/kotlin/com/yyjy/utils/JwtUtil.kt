package com.yyjy.utils

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.yyjy.common.ExamProperties
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException
import java.util.*

/**
 * @author Nyxcirea
 * @date 2026/2/14
 * @description: JWT工具类
 */
@Component
class JwtUtil(
    private val examProperties: ExamProperties,
) {

    fun createJwt(userId: String): String {
        val (secretKey, ttl) = examProperties.jwt
        val algorithm = Algorithm.HMAC256(secretKey)
        return JWT.create()
            .withSubject(userId)
            .withIssuedAt(Date())
            .withExpiresAt(Date(System.currentTimeMillis() + ttl))
            .sign(algorithm)
    }

    fun parseJwt(token: String): String {
        return try {
            val algorithm = Algorithm.HMAC256(examProperties.jwt.secretKey)
            JWT.require(algorithm)
                .build()
                .verify(token)
                .subject
        } catch (_: com.auth0.jwt.exceptions.TokenExpiredException) {
            // 专门处理过期：可以打印日志或返回 null
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token 已过期")
        } catch (e: Exception) {
            // 处理其他校验失败（签名错误等）
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token 无效：${e.message}")
        }
    }
}