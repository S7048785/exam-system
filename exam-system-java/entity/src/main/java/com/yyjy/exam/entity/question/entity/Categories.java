package com.yyjy.exam.entity.question.entity;

import org.babyfish.jimmer.Formula;
import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public interface Categories {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id();

    @Key
    String name();

    @ManyToOne
    Categories parent();
    
    @IdView
    long parentId();

    int sort();

    @OneToMany(mappedBy = "category")
    List<Questions> questions();

    @OneToMany(mappedBy = "parent")
    List<Categories> children();

    //@Formula(sql = "select count(*) from questions q where q.category_id = ${this}.id")
    //int questionCount();
    @Formula(dependencies = {"questions"})
    default int questionCount() {
        return questions().size();
    }

    @Nullable
    LocalDateTime createTime();

    @Nullable
    LocalDateTime updateTime();

    @Column(name = "deleted_at")
    @LogicalDeleted("now")
    @Nullable
    LocalDateTime delFlag();
}
