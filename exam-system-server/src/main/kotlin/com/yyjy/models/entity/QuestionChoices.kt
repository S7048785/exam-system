package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 题目选项表（选择题选项）
 */
@Entity
interface

QuestionChoices {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    @OnDissociate(DissociateAction.DELETE)
    @ManyToOne
    val question: Questions

    @IdView
    val questionId: Long

    val content: String

    @Column(name = "is_correct")
    val correct: Boolean?

    val sort: Int?

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

