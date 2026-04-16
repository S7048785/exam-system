package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 题目答案表（标准答案和关键词）
 */
@Entity
interface QuestionAnswers {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    @OnDissociate(DissociateAction.DELETE)
    @OneToOne
    val question: Questions

    @IdView
    val questionId: Long

    val answer: String

    val keywords: String?

    /**
     * 创建时间
     */
    val createTime: LocalDateTime?

    /**
     * 更新时间
     */
    val updateTime: LocalDateTime?

    /**
     * 0-未删除，1-已删除
     */
    @Column(name = "deleted_at")
    @LogicalDeleted("now")
    val delFlag: LocalDateTime?
}

