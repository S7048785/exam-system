package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 试卷表（试卷基本信息）
 */
@Entity
interface Paper {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Int

    val name: String

    val description: String?

    /**
     * 试卷状态: DRAFT（草稿）/PUBLISHED（已发布）/STOPPED（已停用）
     */
    val status: String

    /**
     * 总分
     */
    val totalScore: Double?

    val questionCount: Int?

    val duration: Int

//    @ManyToManyView(
//        prop = "paperQuestions",
//        deeperProp = "question"
//    )
//    val questions: List<Questions>

    @OneToMany(mappedBy = "paper")
    val paperQuestions: List<PaperQuestion>

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

