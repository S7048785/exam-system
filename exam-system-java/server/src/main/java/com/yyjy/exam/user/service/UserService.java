package com.yyjy.exam.user.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.entity.user.entity.UsersDraft;
import com.yyjy.exam.user.repository.UsersRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.jetbrains.annotations.Nullable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
	
	private final UsersRepository usersRepository;
	
	public UserService(UsersRepository usersRepository) {
		this.usersRepository = usersRepository;
	}
	
	public void login(String email, String password) {
		Users userDb = usersRepository.findByEmail(email)
				               .orElseThrow(() -> new BusinessException("用户名或密码错误"));
		if (!new BCryptPasswordEncoder().matches(password, userDb.password())) {
			throw new BusinessException("用户名或密码错误");
		}
		StpUtil.login(userDb.id());
	}
	
	public void registerUser(String email, String realName, String password) {
		if (usersRepository.findByEmail(email).isPresent()) {
			throw new BusinessException("邮箱号已存在");
		}
		String hashedPassword = new BCryptPasswordEncoder().encode(password);
		usersRepository.save(UsersDraft.$.produce(draft -> {
			draft.setEmail(email);
			draft.setPassword(hashedPassword);
			draft.setRealName(realName);
		}));
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
