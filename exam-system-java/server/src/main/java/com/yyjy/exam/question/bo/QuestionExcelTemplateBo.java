package com.yyjy.exam.question.bo;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class QuestionExcelTemplateBo {

    @ExcelProperty("题目内容")
    private String content;

    @ExcelProperty("题目类型")
    private String type;

    @ExcelProperty("是否多选")
    private String multiple;

    @ExcelProperty("分类id")
    private String categoryId;

    @ExcelProperty("难度")
    private String difficulty;

    @ExcelProperty("分值")
    private String score;

    @ExcelProperty("选项A")
    private String choiceA;

    @ExcelProperty("选项B")
    private String choiceB;

    @ExcelProperty("选项C")
    private String choiceC;

    @ExcelProperty("选项D")
    private String choiceD;

    @ExcelProperty("答案")
    private String answer;

    @ExcelProperty("解析")
    private String analysis;
}
