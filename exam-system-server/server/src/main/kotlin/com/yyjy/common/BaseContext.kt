package com.yyjy.common

/**
 * @author Nyxcirea
 * @date 2026/2/14
 * @description: TODO
 */
class BaseContext {
    companion object {
        private val threadLocal = ThreadLocal<Long?>()

        fun setCurrentId(id: Long) {
            threadLocal.set(id)
        }
        fun getCurrentId(): Long? {
            return threadLocal.get()
        }
        fun removeCurrentId() {
            threadLocal.remove()
        }
    }
}