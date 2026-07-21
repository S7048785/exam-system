package com.yyjy.exam.entity.question.entity;

import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
public interface QuestionAnswers {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	long id();
	
	@OneToOne
	@OnDissociate(DissociateAction.DELETE)
	Questions question();
	
	@IdView
	long questionId();
	
	String answer();
	
	@Nullable
	LocalDateTime createTime();
	
	@Nullable
	LocalDateTime updateTime();
	
	@Column(name = "deleted_at")
	@LogicalDeleted("now")
	@Nullable
	LocalDateTime delFlag();
}
