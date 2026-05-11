package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 试卷题目关联表（试卷包含的题目）
 */
@Entity
interface PaperQuestion {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Int

    @ManyToOne
    val paper: com.yyjy.models.entity.Paper

    @ManyToOne
    @OnDissociate(DissociateAction.DELETE)
    val question: com.yyjy.models.entity.Questions

    val score: Double

    /**
     * 创建时间
     */
    val createTime: LocalDateTime?

    /**
     * 更新时间
     */
    val updateTime: LocalDateTime?

    /**
     * 删除时间
     */
    @Column(name = "deleted_at")
    @LogicalDeleted("now")
    val delFlag: LocalDateTime?
}

