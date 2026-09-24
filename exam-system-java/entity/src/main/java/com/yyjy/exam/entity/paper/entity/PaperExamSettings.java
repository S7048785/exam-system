package com.yyjy.exam.entity.paper.entity;

import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;

/**
 * 试卷考试设置（与 paper 1:1）
 */
@Entity
public interface PaperExamSettings {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY
	)
	long id();
	
	@OneToOne
	Paper paper();
	
	/**
	 * 考试时长（分钟）
	 */
	int duration();
	
	/**
	 * 开始时间
	 */
	LocalDateTime start();
	
	/**
	 * 结束时间
	 */
	LocalDateTime end();
	
	/**
	 * 单用户允许的考试次数上限，默认 1。
	 * 口径：**开考即计入**（含中途放弃、状态仍为 ONGOING 的记录）；软删除的记录不计。
	 */
	int maxAttempts();
	
	/**
	 * 及格分（必填，默认 0；用基本类型 —— Jimmer 把装箱类型默认当作可空）
	 */
	int passingScore();
	
	/**
	 * 必须答完题才能交卷
	 */
	@Nullable
	Boolean requireAllAnswered();
	
	/**
	 * 不显示试题分数
	 */
	@Nullable
	Boolean hideQuestionScore();
	
	/**
	 * 交卷后显示考生名次
	 */
	@Nullable
	Boolean showRankAfterSubmit();
	
	/**
	 * 交卷后可查看标准答案
	 */
	@Nullable
	Boolean showAnswerAfterSubmit();
	
	/**
	 * 考生至少作答 x 分钟后才能交卷。
	 * <p>
	 * null = 不启用该限制（前端「至少作答时长」不勾选时传 null）；0 与 null 都视为不限。
	 */
	@Nullable
	Integer minAnswerMinutes();
	
	/**
	 * 试题乱序
	 */
	@Nullable
	Boolean shuffleQuestions();
	
	/**
	 * 选项乱序
	 */
	@Nullable
	Boolean shuffleChoices();
}

