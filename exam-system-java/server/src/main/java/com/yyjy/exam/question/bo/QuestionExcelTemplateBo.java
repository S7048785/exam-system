package com.yyjy.exam.question.bo;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Excel 试题导入模板的列定义。
 * <p>
 * 2026-09-20 重写：全部改用大白话，不向用户暴露枚举与数据库 id，题型由选项和答案自动推断。
 * <ul>
 *   <li>去掉「题目类型」列 —— 用户不用猜 SINGLE_CHOICE / MULTIPLE_CHOICE / JUDGE / TEXT</li>
 *   <li>去掉「是否多选」列 —— 答案填 ABC 就是多选</li>
 *   <li>「分类id」改为「分类名」—— 支持 <code>数学/算数</code> 这种多级路径，不存在则自动创建</li>
 *   <li>「难度」接受中文（容易 / 中等 / 困难），也兼容 EASY / MEDIUM / HARD</li>
 * </ul>
 * 列顺序即字段声明顺序（写表头按字段顺序，读按表头名匹配，所以用户调换列顺序没关系，但不能改表头文字）。
 * <p>
 * ⚠️ {@code @NoArgsConstructor} 不能省：EasyExcel 读的时候要用无参构造器反射建实例，
 * 只用 {@code @Builder} 会把默认构造器吃掉，报 {@code Can not instance class}（旧版就踩了这个）。
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionExcelTemplateBo {
	
	@ExcelProperty("试题内容")
	private String content;
	
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
	
	@ExcelProperty("分类名")
	private String categoryName;
	
	@ExcelProperty("难度")
	private String difficulty;
	
	@ExcelProperty("分值")
	private String score;
	
	@ExcelProperty("解析")
	private String analysis;
}
