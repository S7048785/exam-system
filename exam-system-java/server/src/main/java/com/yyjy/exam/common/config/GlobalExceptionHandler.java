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

@RestControllerAdvice
public class GlobalExceptionHandler {
	
	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
	
	@ExceptionHandler
	public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
		return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
				       .body(new ErrorResponse(ex.getMessage()));
	}
	
	@ExceptionHandler
	public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException() {
		return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
				       .body(new ErrorResponse("上传文件过大"));
	}
	
	@ExceptionHandler
	public ResponseEntity<ErrorResponse> handleException(Exception ex) {
		log.error("服务器内部错误: {}", ex.getMessage(), ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				       .body(new ErrorResponse("服务器内部错误"));
	}
	
	//@ExceptionHandler
	//public ResponseEntity<ErrorResponse> handleException(NotLoginException ex) {
	//	log.error("用户未登录: {}", ex.getMessage(), ex);
	//	return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	//			       .body(new ErrorResponse("用户未登录"));
	//}
	// 全局异常拦截（拦截项目中的NotLoginException异常）
	@ExceptionHandler(NotLoginException.class)
	public ResponseEntity<ErrorResponse> handlerNotLoginException(NotLoginException nle) {
		
		// 判断场景值，定制化异常信息
		String message;
		if (nle.getType().equals(NotLoginException.NOT_TOKEN)) {
			message = "未能读取到有效 token";
		} else if (nle.getType().equals(NotLoginException.INVALID_TOKEN)) {
			message = "token 无效";
		} else if (nle.getType().equals(NotLoginException.TOKEN_TIMEOUT)) {
			message = "token 已过期";
		} else if (nle.getType().equals(NotLoginException.BE_REPLACED)) {
			message = "token 已被顶下线";
		} else if (nle.getType().equals(NotLoginException.KICK_OUT)) {
			message = "token 已被踢下线";
		} else if (nle.getType().equals(NotLoginException.TOKEN_FREEZE)) {
			message = "token 已被冻结";
		} else if (nle.getType().equals(NotLoginException.NO_PREFIX)) {
			message = "未按照指定前缀提交 token";
		} else {
			message = "当前会话未登录";
		}
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				       .body(new ErrorResponse(message));
		// 返回给前端
		//return SaResult.error(message);
	}
	
}
