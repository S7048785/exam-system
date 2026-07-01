package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.constants.TokenConstant
import com.yyjy.models.entity.Users
import com.yyjy.models.entity.by
import com.yyjy.models.entity.dto.UserLoginInput
import com.yyjy.models.entity.dto.UserRegisterInput
import com.yyjy.service.CaptchaService
import com.yyjy.service.EmailService
import com.yyjy.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.apache.commons.logging.LogFactory
import org.babyfish.jimmer.client.ApiIgnore
import org.babyfish.jimmer.client.FetchBy
import org.babyfish.jimmer.client.meta.Api
import org.babyfish.jimmer.sql.kt.fetcher.newFetcher
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException

/**
 * @author Nyxcirea
 * date 2026/4/4
 */
@Api
@Tag(name = "用户模块")
@RequestMapping("/user")
@RestController
class UserController(
    private val userService: UserService,
    private val captchaService: CaptchaService,
    private val emailService: EmailService,
) {

    private val log = LogFactory.getLog(UserController::class.java)

    @ApiIgnore
    @Operation(summary = "新增用户")
    @PostMapping("/add")
    fun addUser(@RequestBody user: Users): R<String?> {
        return R.ok()
    }

    @ApiIgnore
    @Operation(summary = "更新用户")
    @PutMapping("/update/{id}")
    fun updateUser(@PathVariable id: Long, @RequestBody user: Users): R<String?> {
        return R.ok()
    }

    @ApiIgnore
    @Operation(summary = "删除用户")
    @DeleteMapping("/remove/{id}")
    fun removeUser(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Api
    @Operation(summary = "发送注册验证码")
    @PostMapping("/send-captcha")
    suspend fun sendCaptcha(@RequestParam email: String, @RequestParam captcha: String): R<String> {
        captchaService.verifyCaptcha(captcha) ?: throw ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "验证码验证失败"
        )
        emailService.generateAndSendCaptcha(email)
        return R.ok(msg="验证码已发送")
    }

    @Api
    @Operation(summary = "用户登录")
    @PostMapping("/login")
    suspend fun loginUser(@RequestBody user: UserLoginInput, response: HttpServletResponse): R<String?> {

        val token = userService.login(user.email, user.password)

        // 2. 构建符合安全规范的 Cookie
        val cookie = ResponseCookie.from(TokenConstant.ACCESS_TOKEN_NAME, token)
            .httpOnly(true)            // 关键：防止 JS 读取（防 XSS）
            .secure(false)             // 如果是本地开发环境(http)设为 false，线上生产环境(https)必须设为 true
            .path("/")                 // 整个域名下都可用
            .maxAge(7 * 24 * 3600)     // 有效期，单位秒（这里设置为 7 天）
            .sameSite("Lax")           // 限制第三方 Cookie，防 CSRF 攻击。如果是跨域前后端分离开发，可能需要设为 "None" (此时 secure 必须为 true)
            .build()
        // 3. 将 Cookie 添加到响应头
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
        return R.ok(msg="登录成功")
    }

    @Api
    @Operation(summary = "退出登录")
    @PostMapping("/logout")
    fun logout(response: HttpServletResponse): R<String?> {
        // 1. 构建一个立即过期的 Cookie
        val cookie = ResponseCookie.from(TokenConstant.ACCESS_TOKEN_NAME, "")
            .httpOnly(true)
            .secure(false) // 保持与登录时一致
            .path("/")    // 必须与登录时的 path 完全一致，否则浏览器不会删除
            .maxAge(0)    // 关键：设为 0 告诉浏览器立即删除
            .sameSite("Lax")
            .build()

        // 2. 将这个覆盖用的 Cookie 放入响应头
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())

        return R.ok(msg = "已退出登录")
    }

    @Api
    @Operation(summary = "用户注册")
    @PostMapping("/register")
    suspend fun registerUser(@RequestBody user: UserRegisterInput): R<String?> {

        // 验证邮箱验证码
        if (!emailService.verifyCaptcha(user.email, user.captcha)) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "邮箱验证码错误或已过期")
        }

        userService.registerUser(user.email, user.realName, user.password)
        log.info("用户注册成功: ${user.email}")
        return R.ok(msg="注册成功")
    }

    @Api
    @Operation(summary = "获取用户登录信息")
    @GetMapping("/info")
    fun getUserInfo(request: HttpServletRequest): R<@FetchBy("USER_INFO") Users> {
        val token = request.cookies?.find { it.name == TokenConstant.ACCESS_TOKEN_NAME }?.value
        if (token == null) {
            log.info("用户未登录")
            return R.ok(msg="用户未登录")
        }
        return R.ok(userService.getUserInfo(token, USER_INFO))
    }

    companion object {
        val USER_INFO  = newFetcher(Users::class).by {
            email()
            realName()
            role()
        }
    }

}