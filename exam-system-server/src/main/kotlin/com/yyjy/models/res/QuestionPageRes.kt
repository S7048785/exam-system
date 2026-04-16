package com.yyjy.models.res

import com.yyjy.models.entity.dto.QuestionsPageView

/**
 * @author Nyxcirea
 * @date 2026/4/9
 * @description: TODO
 */
data class QuestionPageRes(
    val records: List<QuestionsPageView>,
    val total: Long,
    val current: Int,
    val size: Int,
    val pages: Long
)