package com.yyjy.exam.user.service;

import com.yyjy.exam.common.config.RabbitMQConfig;
import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.user.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@RequiredArgsConstructor
@Component
public class EmailSendConsumer {

    private final UsersRepository usersRepository;
    private final EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.MAIL_QUEUE)
    public void consume(String uuid) {
        log.info("收到邮件发送消息, uuid: {}", uuid);

        Users user = usersRepository.findByUuid(uuid).orElse(null);
        if (user == null) {
            log.warn("用户不存在, uuid: {}", uuid);
            return;
        }

        try {
            emailService.sendVerificationLink(user.email(), uuid);
            log.info("验证邮件发送成功, email: {}", user.email());
        } catch (Exception e) {
            log.error("验证邮件发送失败, email: {}, 将自动重试", user.email(), e);
            throw e;
        }
    }
}
