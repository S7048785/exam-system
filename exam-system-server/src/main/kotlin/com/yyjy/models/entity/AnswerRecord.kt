package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 答题记录表（每道题的答题详情）
 */
@Entity
interface AnswerRecord {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Int

    @ManyToOne
    val examRecord: ExamRecords

    @ManyToOne
    val question: Questions

    /**
     * 用户答案
     */
    val userAnswer: String?

    /**
     * 分数
     */
    val score: Int?

    /**
     * 是否正确
     */
    @Column(name = "is_correct")
    val correct: Int?

    /**
     * ai校正
     */
    val aiCorrection: String?

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

