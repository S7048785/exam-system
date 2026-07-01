package com.yyjy.service

import com.yyjy.common.ExamProperties
import com.yyjy.constants.CacheConstant
import org.apache.commons.logging.LogFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.core.script.DefaultRedisScript
import org.springframework.http.HttpStatus
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

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

        val key = "${CacheConstant.CAPTCHA_REGISTER_KEY}$email"

        // Lua 脚本：原子地检查 TTL 并写入
        // 返回 1 = 成功，0 = 被速率限制
        val luaScript = DefaultRedisScript(
            """
    local ttl = redis.call('TTL', KEYS[1])
    if ttl > 120 then
        return 0
    end
    redis.call('SET', KEYS[1], ARGV[1], 'EX', 180)
    return 1
    """.trimIndent(),
            Long::class.java
        )
        val code = (100000..999999).random().toString()
        val result = redisTemplate.execute(luaScript, listOf(key), code)
        if (result == 0L) {
            throw ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY, "验证码已发送，请稍后再试"
            )
        }
        try {
            sendRegisterCaptcha(email, code)
        } catch (e: Exception) {
            redisTemplate.delete(key)
            log.error("验证码邮件发送失败: $email", e)
            throw ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "邮件发送失败，请稍后重试"
            )
        }
        log.info("验证码已发送至 $email")
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
        // 检查验证码是否匹配
        if (storedCode == code) {
            // 验证成功，清除验证码
            redisTemplate.delete(key)
            return true
        }
        throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "验证码错误")
    }
}