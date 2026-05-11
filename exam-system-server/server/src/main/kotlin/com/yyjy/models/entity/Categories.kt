package com.yyjy.models.entity

import org.babyfish.jimmer.Formula
import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 题目分类表（分类体系）
 */
@Entity
interface Categories {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    @Key
    val name: String

    @ManyToOne
    val parent: com.yyjy.models.entity.Categories

    @IdView
    val parentId: Long

    val sort: Int

    @OneToMany(mappedBy = "category")
    val questions: List<com.yyjy.models.entity.Questions>

    @OneToMany(mappedBy = "parent")
    val children: List<com.yyjy.models.entity.Categories>

    /**
     * 创建时间
     */
    val createTime: LocalDateTime?

    /**
     * 更新时间
     */
    val updateTime: LocalDateTime?

    @Formula(dependencies = ["questions"])
    val questionCount: Int
        get() = questions.size

    /**
     * 删除时间
     */
    @Column(name = "deleted_at")
    @LogicalDeleted("now")
    val delFlag: LocalDateTime?
}

