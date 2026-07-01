package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 题目表
 */
@Entity
interface Questions {

    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    val title: String

    val type: String

    val multi: Boolean?

    @ManyToOne
    val category: com.yyjy.models.entity.Categories

    @IdView
    val categoryId: Long

    val difficulty: String

    val score: Int?

    val analysis: String?

//    @ManyToManyView(
//        prop = "paperQuestions",
//        deeperProp = "paper"
//    )
//    val papers: List<Paper>

    @OneToMany(mappedBy = "question")
    val paperQuestions: List<com.yyjy.models.entity.PaperQuestion>

    @OneToMany(mappedBy = "question")
    val questionChoices: List<com.yyjy.models.entity.QuestionChoices>

    @OneToOne(mappedBy = "question")
    val questionAnswers: com.yyjy.models.entity.QuestionAnswers?

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

