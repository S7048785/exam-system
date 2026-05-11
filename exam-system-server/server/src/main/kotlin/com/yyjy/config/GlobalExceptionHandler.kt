package com.yyjy.config

import com.yyjy.common.R
import com.yyjy.common.BusinessException
import io.swagger.v3.oas.annotations.Hidden
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.multipart.MaxUploadSizeExceededException

/**
 * @author Nyxcirea
 * @date 2026/3/2
 * @description: TODO
 */
@Hidden
@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler
    fun handleBusinessException(ex: BusinessException): R<String?> {
        return R.fail( ex.message ?: "未知错误")
    }

    @ExceptionHandler
    fun handleMaxUploadSizeExceededException(ex: MaxUploadSizeExceededException): R<String?> {
        return R.fail(ex.message ?: "上传文件过大")
    }

//    @ExceptionHandler
//    fun handleException(ex: Exception): ApiRes<String?> {
//        return ApiRes.fail( HttpStatus.INTERNAL_SERVER_ERROR.value(), "服务器内部错误: ${ex.message}")
//    }
}