package com.yyjy.common

/**
 * @author Nyxcirea
 * @date 2026/3/2
 * @description: TODO
 */
class BusinessException(message: String, code: Int = 500) : RuntimeException(message)