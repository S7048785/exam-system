package com.yyjy.service

import com.yyjy.common.ExamProperties
import com.yyjy.constants.CacheConstant
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.apache.commons.logging.LogFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.http.HttpStatus
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.util.concurrent.TimeUnit

@Service
class EmailService(
    private val mailSender: JavaMailSender,
    private val redisTemplate: RedisTemplate<String, Any>,
    private val examProperties: ExamProperties,
) {
    private val log = LogFactory.getLog(EmailService::class.java)
    /**
     * 发送注册验证码邮件
     * @param to 收件人邮箱
     * @param code 验证码
     */
    fun sendRegisterCaptcha(to: String, code: String) {
        val subject = "【考试系统】注册验证码"
        val content = """
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>您好，欢迎注册考试系统</h2>
                <p>您的注册验证码为：</p>
                <div style="font-size: 24px; font-weight: bold; color: #1890ff; padding: 15px; background: #f0f9ff; border-radius: 8px; text-align: center;">
                    $code
                </div>
                <p>验证码有效期为 <strong>3 分钟</strong>，请勿泄露给他人。</p>
                <p>如果这不是您本人操作，请忽略此邮件。</p>
            </div>
        """.trimIndent()

        val message = mailSender.createMimeMessage()
        val helper = MimeMessageHelper(message, true, "UTF-8")
        helper.setFrom(examProperties.mail.from)
        helper.setTo(to)
        helper.setSubject(subject)
        helper.setText(content, true)
        mailSender.send(message)
    }

    /**
     * 生成验证码并发送
     * @param email 目标邮箱
     */
    fun generateAndSendCaptcha(email: String) {
        val code = (100000..999999).random().toString()
        val key = "${CacheConstant.CAPTCHA_REGISTER_KEY}$email"

        val ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS)
        if (ttl > 120) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "验证码已发送，请等待 1 分钟后重新发送")
        }

        // 存储到Redis，过期时间3分钟
        redisTemplate.opsForValue().set(key, code, 3, TimeUnit.MINUTES)

        // 异步发送邮件
        CoroutineScope(Dispatchers.IO).launch {
            sendRegisterCaptcha(email, code)
            log.info("验证码已发送至 $email")
        }
    }

    /**
     * 验证验证码是否正确
     * @param email 邮箱
     * @param code 用户输入的验证码
     * @return true if valid
     */
    fun verifyCaptcha(email: String, code: String): Boolean {
        val key = "${CacheConstant.CAPTCHA_REGISTER_KEY}$email"
        val storedCode = redisTemplate.opsForValue().get(key)
            ?: throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "验证码不存在")
        return storedCode == code
    }

}