package com.yyjy.controller

import com.yyjy.common.BusinessException
import com.yyjy.common.R
import com.yyjy.models.entity.Users
import com.yyjy.models.entity.dto.UserLoginInput
import com.yyjy.models.entity.dto.UserRegisterInput
import com.yyjy.service.CaptchaService
import com.yyjy.service.UserService
import com.yyjy.utils.RsaUtil
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.babyfish.jimmer.client.ApiIgnore
import org.babyfish.jimmer.client.meta.Api
import org.springframework.http.HttpStatus
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
    private val rsaUtil: RsaUtil
) {

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
    @Operation(summary = "获取RSA公钥")
    @GetMapping("/publicKey")
    fun getPublicKey(): R<String> {
        return R.ok(rsaUtil.getPublicKey())
    }

    @Api
    @Operation(summary = "用户登录")
    @PostMapping("/login")
    suspend fun loginUser(@RequestBody user: UserLoginInput): R<String> {
        captchaService.verifyCaptcha(user.token) ?: throw ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "验证码验证失败"
        )
        // 解密密码后验证
        val decryptedPassword = rsaUtil.decrypt(user.encryptedPassword)
        val token = userService.login(user.username, decryptedPassword)
        return R.ok(token)
    }

    @Api
    @Operation(summary = "用户注册")
    @PostMapping("/register")
    fun registerUser(@RequestBody user: UserRegisterInput): R<String?> {
        userService.registerUser(user.username, user.realName, user.password)
        return R.ok(user.username)
    }

}