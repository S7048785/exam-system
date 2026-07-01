package com.yyjy.config

import com.yyjy.common.ExamProperties
import com.yyjy.utils.MinioUtil
import io.minio.BucketExistsArgs
import io.minio.MakeBucketArgs
import io.minio.MinioClient
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.cglib.core.CollectionUtils.bucket
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration


/**
 * @author Nyxcirea
 * date 2026/4/4
 * description: TODO
 */
@Configuration
class MinioConfig(private val examProperties: ExamProperties) {
    companion object {
        private val log = LoggerFactory.getLogger(MinioConfig::class.java)
    }
    @Bean
    fun minioClient(): MinioClient {
        return MinioClient.builder()
            .endpoint(examProperties.minio.endpoint)
            .credentials(examProperties.minio.accessKey, examProperties.minio.secretKey)
            .build()
    }

}