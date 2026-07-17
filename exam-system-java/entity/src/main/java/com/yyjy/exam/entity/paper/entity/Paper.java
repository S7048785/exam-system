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
	
	@Nullable
	Double totalScore();
	
	@Nullable
	Double PassingScore();
	
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
	
	@Column(name = "deleted_at")
	@LogicalDeleted("now")
	@Nullable
	LocalDateTime delFlag();
}
