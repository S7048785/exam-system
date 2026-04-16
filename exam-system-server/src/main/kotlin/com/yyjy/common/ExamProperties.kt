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
    val minio: MinioConfig = MinioConfig(),
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

    data class MinioConfig(
        var endpoint: String = "",
        var accessKey: String = "",
        var secretKey: String = "",
        var bucket: BucketConfig = BucketConfig()
    )
    data class BucketConfig(
        var file: String = ""
    )
}