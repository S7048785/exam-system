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
	 * 允许的考试次数上限，默认 1（即不可重复）。
	 * 口径：**开考即计入**（含中途放弃、状态仍为 ONGOING 的记录）；软删除的记录不计。
	 */
	int maxAttempts();
	
	int totalScore();
	
	@Nullable
	Integer passingScore();
	
	@Nullable
	Integer questionCount();
	
	int duration();
	
	LocalDateTime start();
	
	LocalDateTime end();
	
	@OneToMany(mappedBy = "paper")
	List<PaperQuestion> paperQuestions();
	
	@Nullable
	LocalDateTime createTime();
	
	@Nullable
	LocalDateTime updateTime();
	
}
