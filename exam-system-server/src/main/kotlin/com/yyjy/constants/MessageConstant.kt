package com.yyjy.constants

/**
 * @author Nyxcirea
 * date 2026/4/4
 * description: TODO
 */
object MessageConstant {
    const val PAPER_RULE_EMPTY: String = "paper: 试卷规则不能为空"
    const val PAPER_QUESTION_EMPTY: String = "paper: 试卷题目不能为空"
    const val PAPER_NOT_FOUND: String = "paper: 试卷不存在"
    const val MINIO_UPLOAD_ERROR: String = "minio: 上传文件失败"
    const val FILE_NOT_EXIST: String = "minio: 文件不存在"
    const val QUESTION_CATEGORY_NOT_EXIST: String = "question: 题目分类不存在"
    const val QUESTION_NOT_EMPTY: String = "question: 题目不能为空"
    const val QUESTION_TYPE_NOT_EXIST: String = "question: 题目类型不存在"
    const val QUESTION_NOT_EXIST: String = "question: 题目不存在"
    // 同类型下已存在同名题目
    const val QUESTION_EXIST: String = "question: 同类型下已存在同名题目"
    // 选择题选项不能为空
    const val QUESTION_CHOICE_CHOICES_NOT_EMPTY: String = "question: 选择题选项不能为空"
    // 非选择题 multi属性不能为true
    const val QUESTION_CHOICE_MULTI_NOT_EMPTY: String = "question: 非选择题 multi属性不能为true"
    // 多选题只能有一个正确答案
    const val QUESTION_CHOICE_MULTI_ANSWER_NOT_EMPTY: String = "question: 多选题只能有一个正确答案"
    // 批量导入的文件格式错误，必须是xlsx或xls格式
    const val FILE_FORMAT_ERROR: String = "question: 批量导入的文件格式错误，必须是xlsx或xls格式"
}