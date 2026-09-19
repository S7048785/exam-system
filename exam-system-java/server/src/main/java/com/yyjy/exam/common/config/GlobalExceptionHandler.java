package com.yyjy.exam.common.config;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotRoleException;
import com.yyjy.exam.common.convention.result.ErrorResponse;
import com.yyjy.exam.common.exception.BusinessException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Objects;

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
	
	/**
	 * Bean Validation（`@Valid`）失败 → 422，提示语取注解上写的 message
	 * （此前会落到下面的兜底里变成 500「服务器内部错误」）
	 */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				                 .map(FieldError::getDefaultMessage)
				                 .filter(Objects::nonNull)
				                 .findFirst()
				                 .orElse("参数校验失败");
		return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
				       .body(new ErrorResponse(message));
	}
	
	/**
	 * 方法参数级校验（`@Validated` 打在 Controller 上）失败 → 422
	 */
	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ErrorResponse> handleConstraintViolationException(ConstraintViolationException ex) {
		String message = ex.getConstraintViolations().stream()
				                 .map(violation -> violation.getMessage())
				                 .filter(Objects::nonNull)
				                 .findFirst()
				                 .orElse("参数校验失败");
		return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
				       .body(new ErrorResponse(message));
	}
	
	/**
	 * 请求体反序列化失败（枚举取不到固定值、字段类型不符等）→ 422。
	 * 带上根因说明，否则前端只知道「格式错了」不知道错在哪。
	 */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
		Throwable cause = ex.getMostSpecificCause();
		String detail = cause.getMessage();
		if (detail == null || detail.isBlank()) {
			detail = "请求体格式错误";
		}
		log.warn("请求体解析失败: {}", detail);
		return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
				       .body(new ErrorResponse("参数不合法：" + detail));
	}
	
	@ExceptionHandler
	public ResponseEntity<ErrorResponse> handleException(Exception ex) {
		log.error("服务器内部错误: {}", ex.getMessage(), ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				       .body(new ErrorResponse("服务器内部错误"));
	}
	
	// 全局异常拦截（拦截项目中的NotLoginException异常）
	@ExceptionHandler(NotLoginException.class)
	public ResponseEntity<ErrorResponse> handlerNotLoginException(NotLoginException nle) {
		
		// 打印堆栈，以供调试
		//nle.printStackTrace();
		
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
	
	@ExceptionHandler(NotRoleException.class)
	public ResponseEntity<ErrorResponse> handlerNotRoleException(NotRoleException nre) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				       .body(new ErrorResponse("当前会话无此角色" + nre.getMessage()));
	}
}
