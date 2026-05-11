package com.yyjy.utils

import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import javax.imageio.ImageIO


/**
 * @author Nyxcirea
 * @date 2026/4/5
 */
object ImageSafeChecker {

    // 允许的 MIME 类型
    private val ALLOWED_MIME_TYPES = setOf("image/jpeg", "image/png", "image/gif", "image/webp")

    // 允许的文件后缀
    private val ALLOWED_EXTENSIONS = setOf("jpg", "jpeg", "png", "gif", "webp")

    /**
     * 深度校验图片安全性
     */
    fun isSafeImage(file: MultipartFile): Boolean {
        // 1. 基础检查：空值与大小限制 (建议配置文件限制，此处示例为 5MB)
        if (file.isEmpty || file.size > 1 * 1024 * 1024) {
            return false
        }

        // 2. MIME 类型检查 (检查 Content-Type 头部)
        val contentType = file.contentType
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.lowercase())) {
            return false
        }

        // 3. 后缀名检查
        val extension = file.originalFilename?.substringAfterLast(".", "")?.lowercase()
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension)) {
            return false
        }

        // 4. 防止 OOM 的内存安全校验：只读元数据，不解码像素
        return try {
            file.inputStream.use { inputStream ->
                val input = ImageIO.createImageInputStream(inputStream)
                val readers = ImageIO.getImageReaders(input)

                if (readers.hasNext()) {
                    val reader = readers.next()
                    try {
                        reader.input = input
                        val width = reader.getWidth(0)
                        val height = reader.getHeight(0)

                        // 校验尺寸是否合理 (防止极高像素的图片炸弹)
                        // 只要能获取到正常的宽高，说明文件头和格式是合法的
                        width > 0 && height > 0 && width < 10000 && height < 10000
                    } finally {
                        reader.dispose()
                    }
                } else {
                    false // 无法识别的图片格式
                }
            }
        } catch (e: IOException) {
            false
        }
    }
}