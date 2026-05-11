package com.yyjy.models.bo

import com.alibaba.excel.annotation.ExcelProperty

/**
 * @author Nyxcirea
 * @date 2026/4/11
 * @description: TODO
 */
data class QuestionExcelTemplateBo(
    @ExcelProperty("题目内容")
    var content: String? = null,
    @ExcelProperty("题目类型")
    var type: String? = null,
    @ExcelProperty("是否多选")
    var multiple: String? = null,
    @ExcelProperty("分类id")
    var categoryId: String? = null,
    @ExcelProperty("难度")
    var difficulty: String? = null,
    @ExcelProperty("分值")
    var score: String? = null,
    @ExcelProperty("选项A")
    var choiceA: String? = null,
    @ExcelProperty("选项B")
    var choiceB: String? = null,
    @ExcelProperty("选项C")
    var choiceC: String? = null,
    @ExcelProperty("选项D")
    var choiceD: String? = null,
    @ExcelProperty("答案")
    var answer: String? = null,
    @ExcelProperty("解析")
    var analysis: String? = null
)
