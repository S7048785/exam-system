package com.yyjy.exam.entity.exam.entity;

import com.yyjy.exam.entity.question.entity.Questions;
import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
public interface AnswerRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int id();

    @ManyToOne
    ExamRecords examRecord();

    @IdView
    int examRecordId();

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

    @Column(name = "deleted_at")
    @LogicalDeleted("now")
    @Nullable
    LocalDateTime delFlag();
}
