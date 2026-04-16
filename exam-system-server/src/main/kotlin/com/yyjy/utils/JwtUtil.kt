package com.yyjy.utils

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.util.*

/**
 * @author Nyxcirea
 * @date 2026/2/14
 * @description: JWT工具类
 */
class JwtUtil {


    companion object {
        private const val SECRET_KEY = "123456"
        private const val TTL = 60 * 60 * 1000L

        fun createJwt(userId: String): String {
            val algorithm = Algorithm.HMAC256(SECRET_KEY)
            return JWT.create()
                .withSubject(userId)
                .withIssuedAt(Date())
                .withExpiresAt(Date(System.currentTimeMillis() + TTL))
                .sign(algorithm)
        }

        fun parseJwt(token: String): String {
            return try {
                val algorithm = Algorithm.HMAC256(SECRET_KEY)
                JWT.require(algorithm)
                    .build()
                    .verify(token)
                    .subject
            } catch (_: com.auth0.jwt.exceptions.TokenExpiredException) {
                // 专门处理过期：可以打印日志或返回 null
                throw Exception("Token 已过期")
            } catch (e: Exception) {
                // 处理其他校验失败（签名错误等）
                throw Exception("Token 无效：${e.message}")
            }
        }

    }
}