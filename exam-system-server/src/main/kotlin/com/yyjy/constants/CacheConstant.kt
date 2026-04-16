package com.yyjy.constants

/**
 * 缓存常量类
 * 定义系统中使用的缓存名称和key前缀
 */
object CacheConstant {
    /**
     * 题目模块缓存名称
     */
    const val QUESTION_CACHE: String = "question"

    /**
     * 试卷模块缓存名称
     */
    const val PAPER_CACHE: String = "paper"

    /**
     * 考试记录模块缓存名称
     */
    const val EXAM_RECORD_CACHE: String = "exam_record"

    /**
     * 题目详情缓存key前缀
     */
    const val QUESTION_DETAIL_KEY: String = "question:detail:"

    /**
     * 分类题目列表缓存key前缀
     */
    const val QUESTION_CATEGORY_KEY: String = "question:category:"

    /**
     * 试卷详情缓存key前缀
     */
    const val PAPER_DETAIL_KEY: String = "paper:detail:"

    /**
     * 考试记录详情缓存key前缀
     */
    const val EXAM_RECORD_DETAIL_KEY: String = "exam_record:detail:"

    /**
     * 热门题目缓存key
     */
    const val POPULAR_QUESTIONS_KEY: String = "question:popular"

    /**
     * 题目访问计数key
     */
    const val QUESTION_VIEW_COUNT_KEY: String = "question:view_count"

    /**
     * 热门题目数量
     */
    const val POPULAR_QUESTIONS_COUNT: Int = 10

    /**
     * 缓存过期时间（秒）
     */
    const val DEFAULT_EXPIRE_SECONDS: Long = 1800 // 30分钟

    /**
     * 热点数据缓存过期时间（秒）
     */
    const val HOT_DATA_EXPIRE_SECONDS: Long = 3600 // 1小时
}