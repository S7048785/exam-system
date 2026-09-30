package com.yyjy.exam.user.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.CacheConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.common.util.CaptchaService;
import com.yyjy.exam.common.util.RedisUtil;
import com.yyjy.exam.entity.Immutables;
import com.yyjy.exam.entity.user.entity.UserStatus;
import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.entity.user.entity.UsersTable;
import com.yyjy.exam.user.event.UserRegisteredEvent;
import com.yyjy.exam.user.repository.UsersRepository;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.DraftObjects;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.jetbrains.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class UserService {
	
	/** 验证邮件冷却时长（秒）。 */
	private static final long MAIL_COOLDOWN_SECONDS = 60L;
	
	private final UsersRepository usersRepository;
	private final CaptchaService captchaService;
	private final ApplicationEventPublisher eventPublisher;
	private final RedisUtil redisUtil;
	
	public UserService(UsersRepository usersRepository, CaptchaService captchaService, ApplicationEventPublisher eventPublisher, RedisUtil redisUtil) {
		this.usersRepository = usersRepository;
		this.captchaService = captchaService;
		this.eventPublisher = eventPublisher;
		this.redisUtil = redisUtil;
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
		
		// 冷却期内直接短路：既不查库也不发信，让用户等一会儿再来。
		// key 用小写邮箱 —— DB 的 email 唯一索引是 ai_ci（大小写不敏感），这里对齐，免得换个大小写就绕过冷却。
		String cooldownKey = CacheConstant.REGISTER_MAIL_COOLDOWN_KEY + email.toLowerCase(Locale.ROOT);
		if (Boolean.TRUE.equals(redisUtil.exists(cooldownKey))) {
			throw new BusinessException("验证邮件刚刚已发送，请 " + MAIL_COOLDOWN_SECONDS + " 秒后再试");
		}
		
		// 重复判定只看**已激活**的用户。未激活的（注册了但没点验证邮件）当死号处理，允许重新注册。
		// status 为 null 视为已激活：宁可拦住，也不要放一个状态不明的账号过去。
		Optional<Users> existing = usersRepository.findByEmail(email);
		if (existing.isPresent() && existing.get().status() != UserStatus.INACTIVE) {
			throw new BusinessException("邮箱号已存在");
		}
		
		String uuid = UUID.randomUUID().toString().replace("-", "");
		String hashedPassword = new BCryptPasswordEncoder().encode(password);
		usersRepository.save(Immutables.createUsers(draft -> {
			// 命中未激活的旧行就复用：带上 id，Jimmer 默认 save（AUTO）有 id 即 UPDATE
			// （与 AdminUserService#update 同一写法）。
			// 之所以不删了重建：users.email 是普通唯一索引，不含 deleted_at，插新行必撞唯一键；
			// 而且复用能保住该用户已有的数据，不会留下孤儿行。
			existing.ifPresent(u -> draft.setId(u.id()));
			draft.setEmail(email);
			draft.setPassword(hashedPassword);
			draft.setRealName(realName);
			draft.setStatus(UserStatus.INACTIVE);
			draft.setUuid(uuid);
		}));
		
		// 注意：这里**不建**试题根分类。根分类改由查询接口兜底懒建
		// （QuestionCategoryController#tree / #list → QuestionCategoryService#ensureRootCategory），
		// 这样老账号、后台建号、直接改库造出来的用户都能被补上。
		
		// 发信不在这里同步做：发布事件，由 UserRegisteredEmailListener 异步发送
		// （Spring 事件机制，替代已关闭的 RabbitMQ 邮件队列）。
		// 此处不关心发送结果：账号已落库为 INACTIVE，发信失败只记日志，不阻断注册。
		eventPublisher.publishEvent(new UserRegisteredEvent(email, uuid));
		log.info("注册成功，已发布验证邮件事件: {}", email);
		
		// 冷却标记挂在「已派出邮件」之后：放在前面的话，一旦后面抛异常（比如邮箱重复），
		// 用户会被白白罚站 1 分钟。
		// ⚠️ exists + set 不是原子操作，并发重复提交理论上能同时通过；注册本身有验证码 + 前端按钮禁用兜着，
		// 真要堵死得换成 SET NX（RedisUtil 目前没这个方法）。
		redisUtil.set(cooldownKey, String.valueOf(System.currentTimeMillis()), MAIL_COOLDOWN_SECONDS);
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
