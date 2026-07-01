package com.yyjy.exam.entity.question.entity;

import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
public interface QuestionChoices {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id();

    @ManyToOne
    @OnDissociate(DissociateAction.DELETE)
    Questions question();

    @IdView
    long questionId();

    String content();

    @Nullable
    @Column(name = "is_correct")
    Boolean correct();

    @Nullable
    Integer sort();

    @Nullable
    LocalDateTime createTime();

    @Nullable
    LocalDateTime updateTime();

    @Column(name = "deleted_at")
    @LogicalDeleted("now")
    @Nullable
    LocalDateTime delFlag();
}
