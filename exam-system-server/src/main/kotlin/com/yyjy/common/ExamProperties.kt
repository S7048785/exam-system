package com.yyjy.common

/**
 * @author Nyxcirea
 * @date 2026/3/7
 */
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "exam") // 前缀锁定在 "exam"
data class ExamProperties(
    val front: FrontConfig = FrontConfig(),
    val exclude: ExcludeConfig = ExcludeConfig(),
    val jwt: JwtConfig = JwtConfig(),
    val minio: MinioConfig = MinioConfig(),
    val cap: CapConfig = CapConfig(),
    val rsa: RsaConfig = RsaConfig()
) {
    // 内部数据类：映射 front
    data class FrontConfig(
        // 自动将 YAML 数组映射为 List<String>
        // 默认值为空列表，防止 null
        val ip: List<String> = emptyList()
    )

    // 内部数据类：映射 exclude
    data class ExcludeConfig(
        // 自动将 YAML 数组映射为 List<String>
        val path: List<String> = emptyList()
    )
    data class JwtConfig (
        val secretKey: String = "",
        val ttl: Long = 0,
    )
    data class MinioConfig(
        var endpoint: String = "",
        var accessKey: String = "",
        var secretKey: String = "",
        var bucket: BucketConfig = BucketConfig()
    )
    data class BucketConfig(
        val file: String = ""
    )
    data class CapConfig(
        val url: String = "",
        val siteKey: String = "",
        val secretKey: String = ""
    )
    data class RsaConfig(
        val publicKey: String = "",
        val privateKey: String = ""
    )
}