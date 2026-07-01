package com.yyjy.exam.entity.user.io.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserRegisterReq(
        @Email(message = "邮箱格式错误")
        String email,

        @NotBlank(message = "验证码不能为空")
        String captcha,

        @NotBlank(message = "真实姓名不能为空")
        String realName,

        @NotBlank(message = "密码不能为空")
        String password
) {
}
