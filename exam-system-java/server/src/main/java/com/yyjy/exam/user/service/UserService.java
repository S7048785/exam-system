package com.yyjy.exam.user.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.common.util.CaptchaService;
import com.yyjy.exam.entity.Immutables;
import com.yyjy.exam.entity.user.entity.UserStatus;
import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.entity.user.entity.UsersTable;
import com.yyjy.exam.user.repository.UsersRepository;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.DraftObjects;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.jetbrains.annotations.Nullable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;


@Slf4j
@Service
public class UserService {
	
	private final UsersRepository usersRepository;
	private final CaptchaService captchaService;
	private final EmailService emailService;
	
	public UserService(UsersRepository usersRepository, CaptchaService captchaService, EmailService emailService) {
		this.usersRepository = usersRepository;
		this.captchaService = captchaService;
		this.emailService = emailService;
	}
	
	public Users login(String email, String password, Fetcher<Users> fetcher) {
		var fetcher2 = fetcher.add("password").add("status");
		
		Users userDb = usersRepository.findByEmail(email, fetcher2)
				               .orElseThrow(() -> new BusinessException("用户名或密码错误"));
		if (!new BCryptPasswordEncoder().matches(password, userDb.password())) {
			throw new BusinessException("用户名或密码错误");
		}
		
		if (userDb.status() == UserStatus.INACTIVE) {
			throw new BusinessException("请先验证邮箱后再登录");
		}
		
		var userRes = Immutables.createUsers(userDb, draft -> DraftObjects.unload(draft, UsersTable.PASSWORD));
		
		
		StpUtil.login(userDb.id());
		return userRes;
	}
	
	public void registerUser(String email, String realName, String password, String captchaToken) {
		Boolean verified = captchaService.verifyCaptcha(captchaToken);
		if (verified == null || !verified) {
			throw new BusinessException("人机验证失败，请重试");
		}
		
		if (usersRepository.findByEmail(email).isPresent()) {
			throw new BusinessException("邮箱号已存在");
		}
		
		String uuid = UUID.randomUUID().toString().replace("-", "");
		String hashedPassword = new BCryptPasswordEncoder().encode(password);
		usersRepository.save(Immutables.createUsers(draft -> {
			draft.setEmail(email);
			draft.setPassword(hashedPassword);
			draft.setRealName(realName);
			draft.setStatus(UserStatus.INACTIVE);
			draft.setUuid(uuid);
		}));
		
		emailService.sendVerificationLink(email, uuid);
	}
	
	public void confirmUser(String uuid) {
		Users user = usersRepository.findByUuid(uuid)
				.orElseThrow(() -> new BusinessException("验证链接无效"));

		if (user.status() != UserStatus.ACTIVE) {
			usersRepository.save(Immutables.createUsers(user, draft -> draft.setStatus(UserStatus.ACTIVE)));
		}
	}
	
	@Nullable
	public Users getUserInfo(Fetcher<Users> fetcher) {
		long userId;
		try {
			userId = StpUtil.getLoginIdAsLong();
		} catch (Exception e) {
			return null;
		}
		return usersRepository.findById(userId, fetcher)
				       .orElseThrow(() -> new BusinessException("用户不存在"));
	}
	
	
}
