package com.yyjy.exam.entity.notice.entity;

import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
public interface Notices {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id();

    String title();

    String content();

    @Nullable
    String type();

    @Nullable
    Integer priority();

    @Nullable
    @Column(name = "is_active")
    Integer active();

    @Nullable
    LocalDateTime createTime();

    @Nullable
    LocalDateTime updateTime();

    @Column(name = "deleted_at")
    @LogicalDeleted("now")
    @Nullable
    LocalDateTime delFlag();
}
