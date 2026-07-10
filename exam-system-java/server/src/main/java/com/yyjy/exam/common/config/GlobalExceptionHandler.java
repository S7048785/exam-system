package com.yyjy.exam.common.config;

import cn.dev33.satoken.exception.NotLoginException;
import com.yyjy.exam.common.convention.result.ErrorResponse;
import com.yyjy.exam.common.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {
	
	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
	
	@ExceptionHandler
	public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
		return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
				       .body(new ErrorResponse(ex.getMessage()));
	}
	
	@ExceptionHandler
	public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
		return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
				       .body(new ErrorResponse("上传文件过大"));
	}
	
	@ExceptionHandler
	public ResponseEntity<ErrorResponse> handleException(Exception ex) {
		log.error("服务器内部错误: {}", ex.getMessage(), ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				       .body(new ErrorResponse("服务器内部错误"));
	}
	
	@ExceptionHandler
	public ResponseEntity<ErrorResponse> handleException(NotLoginException ex) {
		log.error("用户未登录: {}", ex.getMessage(), ex);
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				       .body(new ErrorResponse("用户未登录"));
	}
	
}
