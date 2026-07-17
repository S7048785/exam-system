package com.yyjy.exam.entity.paper.entity;

import com.yyjy.exam.entity.question.entity.Questions;
import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
public interface PaperQuestion {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	int id();
	
	@OnDissociate(DissociateAction.DELETE)
	@ManyToOne
	Paper paper();
	
	@ManyToOne
	@OnDissociate(DissociateAction.DELETE)
	Questions question();
	
	double score();
	
	@Nullable
	LocalDateTime createTime();
	
	@Nullable
	LocalDateTime updateTime();
	
	@Column(name = "deleted_at")
	@LogicalDeleted("now")
	@Nullable
	LocalDateTime delFlag();
}
