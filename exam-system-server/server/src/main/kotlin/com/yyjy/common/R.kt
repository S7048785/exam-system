package com.yyjy.common

import java.io.Serializable

/**
 * @author Nyxcirea
 * @date 2026/2/13
 * @description: TODO
 */
data class R<T>(
    var code: Int?,
    var msg: String?,
    var data: T?
): Serializable {
    companion object {
        fun <T> ok(data: T? = null, msg: String = "ok"): R<T> = R(code = 200, msg = msg, data = data)

        fun <T> fail(msg: String): R<T> = R(code = 500, msg = msg, data = null)
    }
}

data class PageRes<T>(
    var total: Long = 0,
    var page: Int = 1,
    var page_size: Int = 10,
    var list: List<T>
)