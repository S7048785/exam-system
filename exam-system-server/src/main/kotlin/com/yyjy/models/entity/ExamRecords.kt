package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 考试记录表（考试过程和结果）
 */
@Entity
interface ExamRecords {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Int

    val examId: Int

    val studentName: String

    val score: Int?

    /**
     * 答案
     */
    val answers: String?

    val startTime: LocalDateTime?

    val endTime: LocalDateTime?

    val status: String?

    /**
     * 窗口切换
     */
    val windowSwitches: Int?

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

