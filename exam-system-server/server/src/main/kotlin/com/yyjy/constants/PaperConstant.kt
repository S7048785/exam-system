package com.yyjy.constants

/**
 * @author Nyxcirea
 * @date 2026/4/17
 * @description: TODO
 */
object PaperConstant {
    object STATUS {
        const val DRAFT = "DRAFT"
        const val PUBLISHED = "PUBLISHED"
        const val STOPPED = "STOPPED"
    }
}

enum class PaperStatus(val value: String) {
    DRAFT("DRAFT"),
    PUBLISHED("PUBLISHED"),
    STOPPED("STOPPED")
}
