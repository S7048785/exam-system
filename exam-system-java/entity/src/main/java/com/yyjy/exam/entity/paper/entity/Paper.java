package com.yyjy.exam.entity.paper.entity;

import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public interface Paper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int id();

    String name();

    @Nullable
    String description();

    String status();

    @Nullable
    Double totalScore();

    @Nullable
    Integer questionCount();

    int duration();

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
