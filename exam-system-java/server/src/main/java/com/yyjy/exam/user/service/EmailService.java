package com.yyjy.exam.user.service;

import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.common.property.MailProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public EmailService(JavaMailSender mailSender, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
    }

    public void sendVerificationLink(String to, String uuid) {
        String link = mailProperties.confirmUrl() + "?id=" + uuid;
        String subject = "【考试系统】请验证您的邮箱";
        String content = """
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>感谢注册考试系统</h2>
                    <p>请点击下方链接验证您的邮箱：</p>
                    <div style="padding: 15px; text-align: center;">
                        <a href="%s" style="display: inline-block; padding: 12px 32px; font-size: 16px; color: #fff; background: #1890ff; border-radius: 6px; text-decoration: none;">验证邮箱</a>
                    </div>
                    <p>如果按钮无法点击，请复制以下链接到浏览器：</p>
                    <p style="font-size: 12px; color: #666; word-break: break-all;">%s</p>
                    <p>如果您没有注册，请忽略此邮件。</p>
                </div>
                """.formatted(link, link);

        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailProperties.from());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);
            mailSender.send(message);
            log.info("验证邮件已发送至 {}", to);
        } catch (Exception e) {
            log.error("验证邮件发送失败: {}", to, e);
            throw new BusinessException("邮件发送失败");
        }
    }
}
