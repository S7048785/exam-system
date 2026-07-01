package com.yyjy.exam.entity.user.io.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserLoginReq(
        @Email(message = "邮箱格式错误")
        String email,

        @NotBlank(message = "密码不能为空")
        String password
) {
}
