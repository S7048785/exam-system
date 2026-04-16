package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.entity.Users
import com.yyjy.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import javax.swing.Spring

/**
 * @author Nyxcirea
 * date 2026/4/4
 * description: TODO
 */
@Tag(name = "用户模块")
@RequestMapping("/user")
@RestController
class UserController(
    private val userService: UserService,
) {

    @Operation(summary = "新增用户")
    @PostMapping("/add")
    fun addUser(@RequestBody user: Users): R<String?> {
        return R.ok()
    }

    @Operation(summary = "更新用户")
    @PutMapping("/update/{id}")
    fun updateUser(@PathVariable id: Long, @RequestBody user: Users): R<String?> {
        return R.ok()
    }

    @Operation(summary = "删除用户")
    @DeleteMapping("/remove/{id}")
    fun removeUser(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

}