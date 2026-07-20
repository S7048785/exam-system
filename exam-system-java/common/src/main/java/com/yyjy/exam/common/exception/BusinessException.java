package com.yyjy.exam.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public class BusinessException extends RuntimeException {
	
	private final HttpStatusCode code;
	
	public BusinessException(String message) {
		this(message, HttpStatus.UNPROCESSABLE_ENTITY);
	}
	
	public BusinessException(String message, HttpStatusCode code) {
		super(message);
		this.code = code;
	}
}
