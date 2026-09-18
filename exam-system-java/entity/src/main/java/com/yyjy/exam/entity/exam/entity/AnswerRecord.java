package com.yyjy.exam.entity.exam.entity;

import com.yyjy.exam.entity.question.entity.Questions;
import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
public interface AnswerRecord {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	long id();
	
	// 删考试记录时连带删除其答案（删试卷的级联路径：paper → exam_records → answer_record）
	@Key
	@ManyToOne
	@OnDissociate(DissociateAction.DELETE)
	ExamRecords examRecord();
	
	@IdView
	int examRecordId();
	
	@Key
	@ManyToOne
	Questions question();
	
	@IdView
	long questionId();
	
	String userAnswer();
	
	@Nullable
	Integer score();
	
	@Nullable
	@Column(name = "is_correct")
	Integer correct();
	
	@Nullable
	String aiCorrection();
	
	@Nullable
	LocalDateTime createTime();
	
	@Nullable
	LocalDateTime updateTime();
	
}
