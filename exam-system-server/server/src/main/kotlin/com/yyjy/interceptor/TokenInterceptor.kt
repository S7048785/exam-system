package com.yyjy.interceptor

import com.yyjy.common.BaseContext
import com.yyjy.constants.TokenConstant
import com.yyjy.utils.JwtUtil
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException
import org.springframework.web.servlet.HandlerInterceptor

/**
 * @author Nyxcirea
 * @date 2026/2/14
 * @description: 拦截器，用于校验token
 */
@Component
class TokenInterceptor(private val jwtUtil: JwtUtil) : HandlerInterceptor {

    private val logger = KotlinLogging.logger {}
    override fun afterCompletion(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        ex: java.lang.Exception?
    ) {
        BaseContext.removeCurrentId()
        super.afterCompletion(request, response, handler, ex)
    }

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        if (request.method == "OPTIONS") {
            return true
        }
        logger.info { "请求路径: ${request.requestURI}" }

        // 从 Cookie 中获取 Token (不再从 Header 获取)
        val token = request.cookies?.find { it.name == TokenConstant.ACCESS_TOKEN_NAME }?.value
        // 如果 Token 为空，直接返回 401 (可选，视业务需求而定)
        if (token.isNullOrBlank()) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户未登录")
//            logger.warn { "缺少 Authorization 头" }
//            throw BusinessException("用户未登录")
        }
        try {
            val userId = jwtUtil.parseJwt(token)
            // 存入ThreadLocal
            BaseContext.setCurrentId(userId.toLong())
        } catch (e: Exception) {
            // 校验失败
            // 返回401状态码
            logger.error { "Token校验失败: ${e.message}" }
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token校验失败")
        }
        return super.preHandle(request, response, handler)
    }

}