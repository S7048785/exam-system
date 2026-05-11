package com.yyjy.utils

import cn.hutool.core.lang.UUID
import com.yyjy.common.BusinessException
import com.yyjy.constants.MessageConstant
import io.minio.*
import io.minio.errors.ErrorResponseException
import io.minio.http.Method
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * @author Nyxcirea
 * date 2026/4/4
 */
@Component
class MinioUtil(private val minioClient: MinioClient) {
    // 类似于 Java 的 static 变量
    companion object {
        private val log = LoggerFactory.getLogger(MinioUtil::class.java)
    }
    /**
     * 判断bucket是否存在，不存在则创建
     */
    fun existBucket(name: String): Boolean {
        try {
            val exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(name).build())
            if (!exists) {
                // bucket不存在，创建bucket
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(name).build());
                return false
            }
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    /**
     * 判断文件是否存在
     * @param bucketName 桶名
     * @param objectName 文件名
     * @return 存在返回true
     */
    fun existFile(bucketName: String, objectName: String?): Boolean {
        try {
            minioClient.statObject(
                StatObjectArgs.builder()
                    .bucket(bucketName)
                    .`object`(objectName)
                    .build()
            )
            // 文件存在
            return true
        } catch (e: Exception) {
            if (e is ErrorResponseException) {
                // 文件不存在
                return false
            }
            // 其他异常
            e.printStackTrace()
            return false
        }
    }

    /**
     * 上传文件
     * @param bucketName 桶名
     * @param file 文件
     */
    fun uploadFile(bucketName: String, file: MultipartFile): String {
        existBucket(bucketName)
        val objectName = file.originalFilename as String
        // 获取当前年月
        val dir1 = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"))
        // 文件名
        val fileName = dir1 + "/" + UUID.randomUUID() + objectName.substring(objectName.lastIndexOf("."))
        try {
            minioClient.putObject(
                PutObjectArgs.builder() // 存储桶名称
                    .bucket(bucketName) //文件在MinIO中的名称
                    .`object`(fileName)
                    .stream(file.inputStream, file.size, -1)
                    .contentType(file.contentType)
                    .build()
            )
            log.info("上传文件成功")
            return "$bucketName/$fileName"
        } catch (e: Exception) {
            e.printStackTrace()
            log.error("上传文件失败")
            throw BusinessException(MessageConstant.MINIO_UPLOAD_ERROR)
        }
    }

    /**
     * 获取文件url
     * @param bucketName
     * @param objectName
     * @return
     */
    fun getFileUrl(bucketName: String, objectName: String): String? {
        // 获取文件url前判断是否存在
        val b = existFile(bucketName, objectName)
        if (!b) {
            // 文件不存在
            throw BusinessException(MessageConstant.FILE_NOT_EXIST)
        }
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .bucket(bucketName)
                    .method(Method.GET)
                    .`object`(objectName)
                    .expiry(60 * 60 * 24) // 有效期1天
                    .build()
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return null
    }

    /**
     * 删除文件
     */
    fun removeFile(bucketName: String, objectName: String) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .`object`(objectName)
                    .build()
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}