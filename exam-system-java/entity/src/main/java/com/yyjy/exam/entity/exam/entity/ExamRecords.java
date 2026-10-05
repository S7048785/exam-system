package com.yyjy.exam.entity.exam.entity;

import com.yyjy.exam.entity.id.NanoIdGenerator;
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
	//@JsonConverter(LongToStringConverter.class)
	long id();
	
	@Key
	// 短码由服务层赋值（ExamRecordService#startExam 里 draft.setPublicId(NanoIdGenerator.next())）：
	// Jimmer 的 @GeneratedValue 只认 @Id 属性，挂普通属性上会被静默忽略 —— 那一列直接不进 INSERT。
	String publicId();
	
	@Nullable
	@ManyToOne
	Users user();
	
	@IdView
	Long userId();
	
	@Key
	// 删试卷时连带删除该卷的考试记录（否则 Jimmer 以 CHECK 模式拒删，模型见笔记 删除.md）
	@ManyToOne
	@OnDissociate(DissociateAction.DELETE)
	Paper paper();
	
	@IdView
	long paperId();
	
	String studentName();
	
	@Nullable
	Integer score();
	
	LocalDateTime startTime();
	
	@Nullable
	LocalDateTime endTime();
	
	@Key
	ExamRecordStatus status();
	
	@Nullable
	Integer windowSwitches();
	
	@OneToMany(mappedBy = "examRecord")
	List<AnswerRecord> answerRecords();
	
	@Nullable
	LocalDateTime createTime();
	
	@Nullable
	LocalDateTime updateTime();
	
}
