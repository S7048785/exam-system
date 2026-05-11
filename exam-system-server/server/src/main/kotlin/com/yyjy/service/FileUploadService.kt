package com.yyjy.service

import com.yyjy.common.ExamProperties
import com.yyjy.utils.ImageSafeChecker
import com.yyjy.utils.MinioUtil
import org.apache.tika.Tika
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import javax.imageio.ImageIO

/**
 * @author Nyxcirea
 * date 2026/4/4
 * description: TODO
 */
@Service
class FileUploadService(
    private val minioUtil: MinioUtil,
    private val examProperties: ExamProperties
) {
    fun uploadImage(file: MultipartFile): String {
        ImageSafeChecker.isSafeImage(file)
        return examProperties.minio.endpoint + "/" + minioUtil.uploadFile(examProperties.minio.bucket.file, file)
    }

    fun validateImage(file: MultipartFile) {
        // 1. 基础校验
        if (file.isEmpty || file.size > 1 * 1024 * 1024) throw Exception("文件过大")

        // 2. 魔数检测 (Apache Tika)
        val actualMimeType = Tika().detect(file.inputStream)
        if (!actualMimeType.startsWith("image/")) throw Exception("真实类型非图片")

        // 3. 结构检测 (ImageIO)
        val bufferedImage = ImageIO.read(file.inputStream) ?: throw Exception("解析图片失败")

        // 4. (可选) 业务限制
        if (bufferedImage.width > 4000) throw Exception("分辨率过高")
    }
}