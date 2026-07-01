package com.yyjy.exam.user.service;

import com.yyjy.exam.common.constant.CacheConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.common.property.MailProperties;
import com.yyjy.exam.common.util.RedisUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final RedisUtil redisUtil;
    private final MailProperties mailProperties;

    public EmailService(JavaMailSender mailSender, RedisUtil redisUtil, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.redisUtil = redisUtil;
        this.mailProperties = mailProperties;
    }

    public void sendRegisterCaptcha(String to, String code) {
        String subject = "【考试系统】注册验证码";
        String content = """
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>您好，欢迎注册考试系统</h2>
                    <p>您的注册验证码为：</p>
                    <div style="font-size: 24px; font-weight: bold; color: #1890ff; padding: 15px; background: #f0f9ff; border-radius: 8px; text-align: center;">
                        %s
                    </div>
                    <p>验证码有效期为 <strong>3 分钟</strong>，请勿泄露给他人。</p>
                    <p>如果这不是您本人操作，请忽略此邮件。</p>
                </div>
                """.formatted(code);

        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailProperties.from());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new BusinessException("邮件发送失败");
        }
    }

    public void generateAndSendCaptcha(String email) {
        String key = CacheConstant.CAPTCHA_REGISTER_KEY + email;

        String luaScript = """
                local ttl = redis.call('TTL', KEYS[1])
                if ttl > 120 then
                    return 0
                end
                redis.call('SET', KEYS[1], ARGV[1], 'EX', 180)
                return 1
                """;

        String code = String.valueOf((int) (100000 + Math.random() * 900000));
        Long result = redisUtil.executeScript(luaScript, key, code);
        if (result == null || result == 0L) {
            throw new BusinessException("验证码已发送，请稍后再试");
        }

        try {
            sendRegisterCaptcha(email, code);
        } catch (Exception e) {
            redisUtil.delete(key);
            log.error("验证码邮件发送失败: {}", email, e);
            throw new BusinessException("邮件发送失败，请稍后重试");
        }
        log.info("验证码已发送至 {}", email);
    }

    public boolean verifyCaptcha(String email, String code) {
        String key = CacheConstant.CAPTCHA_REGISTER_KEY + email;
        String storedCode = redisUtil.get(key);
        if (storedCode == null) {
            throw new BusinessException("验证码不存在");
        }
        if (storedCode.equals(code)) {
            redisUtil.delete(key);
            return true;
        }
        throw new BusinessException("验证码错误");
    }
}
