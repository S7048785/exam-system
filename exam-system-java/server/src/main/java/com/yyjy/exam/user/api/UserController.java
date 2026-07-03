package com.yyjy.exam.user.api;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.common.util.CaptchaService;
import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.entity.user.entity.UsersFetcher;
import com.yyjy.exam.entity.user.io.req.UserLoginReq;
import com.yyjy.exam.entity.user.io.req.UserRegisterReq;
import com.yyjy.exam.user.service.EmailService;
import com.yyjy.exam.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.client.meta.Api;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.web.bind.annotation.*;

@Api
@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
	
	public static final Fetcher<Users> USER_INFO =
			UsersFetcher.$
					.email()
					.realName()
					.role();
	private final UserService userService;
	private final CaptchaService captchaService;
	private final EmailService emailService;
	
	@Api
	@PostMapping("/login")
	public R<Void> loginUser(@RequestBody UserLoginReq user) {
		userService.login(user.email(), user.password());
		return R.ok();
	}
	
	@Api
	@PostMapping("/register")
	public R<Void> registerUser(@RequestBody UserRegisterReq user) {
		if (!emailService.verifyCaptcha(user.email(), user.captcha())) {
			throw new BusinessException("邮箱验证码错误或已过期");
		}
		userService.registerUser(user.email(), user.realName(), user.password());
		return R.ok();
	}
	
	@Api
	@PostMapping("/logout")
	public R<Void> logout() {
		StpUtil.logout();
		return R.ok();
	}
	
	@Api
	@PostMapping("/send-captcha")
	public R<Void> sendCaptcha(@RequestParam String email, @RequestParam String captcha) {
		captchaService.verifyCaptcha(captcha);
		emailService.generateAndSendCaptcha(email);
		return R.ok();
	}
	
	@Api
	@GetMapping("/info")
	public R<@FetchBy("USER_INFO") Users> getUserInfo() {
		var user = userService.getUserInfo(USER_INFO);
		if (user == null) {
			return R.ok();
		}
		return R.ok(user);
	}
}
