package com.yyjy.exam.question.bo;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 批量导入的结果报告。
 * <p>
 * 2026-09-20 新增：批量导入的正确语义是「能导的导、导不了的逐行说明原因」，
 * 而不是解析期一遇到错行就 422 把整份文件丢掉。
 * <pre>
 * parsed            解析通过、进入入库流程的行数
 * imported          真正写进库的条数
 * duplicated        判重跳过的条数（文件内重复 + 库里已存在同名题）
 * failed            解析失败被跳过的行数（明细见 errors）
 * categoriesCreated 本次自动新建的题目分类数
 * </pre>
 */
@Data
public class QuestionImportResult {
	
	/** 解析通过的行数 */
	private int parsed;
	
	/** 成功入库的条数 */
	private int imported;
	
	/** 判重跳过的条数 */
	private int duplicated;
	
	/** 解析失败被跳过的行数 */
	private int failed;
	
	/** 本次自动新建的分类数 */
	private int categoriesCreated;
	
	/** 解析失败的行级说明，形如「3 行：试题内容不能为空」 */
	private List<String> errors = new ArrayList<>();
	
	/** 被判重跳过的题目名（最多保留 10 个，已截断） */
	private List<String> duplicatedTitles = new ArrayList<>();
}
