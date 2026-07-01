package com.yyjy.models.req
/**
 * @author Nyxcirea
 * @date 2026/4/9
 * @description: TODO
 */
data class CategorySaveReq(
    val name: String,
    val parentId: Long,
    val sort: Int,
    var questionCount: Int = 0
)