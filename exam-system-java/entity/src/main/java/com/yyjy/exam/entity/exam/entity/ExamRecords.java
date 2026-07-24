package com.yyjy.exam.entity.exam.entity;

import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.user.entity.Users;
import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public interface ExamRecords {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	int id();
	
	@Nullable
	@ManyToOne
	Users user();
	
	@IdView
	Long userId();
	
	@ManyToOne
	Paper paper();
	
	@IdView
	int paperId();
	
	String studentName();
	
	@Nullable
	Integer score();
	
	@Nullable
	String answers();
	
	@Nullable
	LocalDateTime startTime();
	
	@Nullable
	LocalDateTime endTime();
	
	@Nullable
	ExamRecordStatus status();
	
	@Nullable
	Integer windowSwitches();
	
	@OneToMany(mappedBy = "examRecord")
	List<AnswerRecord> answerRecords();
	
	@Nullable
	LocalDateTime createTime();
	
	@Nullable
	LocalDateTime updateTime();
	
	@Column(name = "deleted_at")
	@LogicalDeleted("now")
	@Nullable
	LocalDateTime delFlag();
}
