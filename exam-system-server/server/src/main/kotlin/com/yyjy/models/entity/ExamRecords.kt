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

    @ManyToOne
    val paper: com.yyjy.models.entity.Paper

    @IdView
    val paperId: Int

    val studentName: String

    val score: Int?

    /**
     * 答案
     */
    val answers: String?

    val startTime: LocalDateTime?

    val endTime: LocalDateTime?

    val status: com.yyjy.models.entity.ExamRecordStatus?

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

    @OneToMany(mappedBy = "examRecord")
    val answerRecords: List<com.yyjy.models.entity.AnswerRecord>

    /**
     * 删除时间
     */
    @Column(name = "deleted_at")
    @LogicalDeleted("now")
    val delFlag: LocalDateTime?
}

@EnumType(EnumType.Strategy.NAME)
enum class ExamRecordStatus {
    ONGOING, // 进行中
    SUBMITTED, // 已提交
    GRADED, // 已评分
}