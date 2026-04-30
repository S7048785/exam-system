package com.yyjy.utils

import cn.hutool.core.util.CharsetUtil
import cn.hutool.core.util.StrUtil
import cn.hutool.crypto.asymmetric.KeyType
import cn.hutool.crypto.asymmetric.RSA
import com.yyjy.common.ExamProperties
import org.springframework.stereotype.Component
import java.util.*

/**
 * @author Nyxcirea
 * @date 2026/4/30
 * @description: RSA非对称加密工具类
 */
@Component
class RsaUtil(
    private val examProperties: ExamProperties
) {
    /**
     * 返回给前端的公钥（Base64字符串）
     */
    fun getPublicKey(): String = examProperties.rsa.publicKey

    /**
     * 解密前端传来的密码
     */
    fun decrypt(encrypted: String): String {
        require(encrypted.isNotBlank()) { "Encrypted data cannot be blank" }

        val rsa = RSA("RSA/ECB/OAEPWithSHA-256AndMGF1Padding", examProperties.rsa.privateKey, null)

        // 关键修改：将 HexUtil 改为 Base64 解码
        val aByte = Base64.getDecoder().decode(encrypted)
        val decrypt = rsa.decrypt(aByte, KeyType.PrivateKey)

        return StrUtil.str(decrypt, CharsetUtil.CHARSET_UTF_8)
    }
}