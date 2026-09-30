package com.yyjy.exam.user.event;

import com.yyjy.exam.user.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 用户注册事件的邮件监听器：异步发送邮箱验证链接。
 * <p>
 * 事件自带 email/uuid，**不再回查用户表** —— 发布时机在账号落库之后，避免依赖事务可见性。
 * <p>
 * ⚠️ 发信失败只记日志、**不向上抛**：注册本身已经成功（账号落库为 INACTIVE），
 * 而 {@code @Async} 线程里异常无人接收，抛出去只会丢掉现场。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserRegisteredEmailListener {
	
	private final EmailService emailService;
	
	@Async
	@EventListener
	public void onUserRegistered(UserRegisteredEvent event) {
		try {
			emailService.sendVerificationLink(event.email(), event.uuid());
			log.info("验证邮件已异步发送, email: {}", event.email());
		} catch (Exception e) {
			log.error("验证邮件发送失败, email: {}", event.email(), e);
		}
	}
}
