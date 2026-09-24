package com.yyjy.exam.entity.paper.entity;

import com.yyjy.exam.entity.user.entity.Users;
import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public interface Paper {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	int id();
	
	@ManyToOne
	Users user();
	
	@JoinColumn(name = "category_id")
	@ManyToOne
	PaperCategories category();
	
	@IdView
	long categoryId();
	
	String name();
	
	@Nullable
	String description();
	
	@Column(name = "is_published")
	boolean published();
	
	/**
	 * 考生参与方式：免登录考试 / 账号登录考试（默认 {@link ParticipateMode#LOGIN_REQUIRED}）。
	 * ⚠️ 目前只存储不执行，见 HANDOFF 4.10。
	 */
	ParticipateMode participateMode();
	
	/**
	 * 考试设置（1:1，独立表 {@code paper_exam_settings}）：时长 / 起止时间 / 次数上限 / 及格分 +
	 * 8 项开关（必须答完才能交卷、多选漏选得分、隐藏题目分数、交卷后显示名次 / 标准答案、
	 * 最少作答分钟数、试题乱序、选项乱序），见 {@link PaperExamSettings}。
	 * <p>
	 * ⚠️ 开关项目前**只存储不执行**；由 Service 显式写入（不是靠级联）。
	 */
	@Nullable
	@OneToOne(mappedBy = "paper")
	PaperExamSettings examSettings();
	
	int totalScore();
	
	@Nullable
	Integer questionCount();
	
	@OneToMany(mappedBy = "paper")
	List<PaperQuestion> paperQuestions();
	
	@Nullable
	LocalDateTime createTime();
	
	@Nullable
	LocalDateTime updateTime();
	
}
