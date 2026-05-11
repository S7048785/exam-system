package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 系统公告表（公告信息）
 */
@Entity
interface Notices {

    /**
     * 公告ID
     */
    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    /**
     * 公告标题
     */
    val title: String

    /**
     * 公告内容
     */
    val content: String

    /**
     * 公告类型：SYSTEM(系统)、FEATURE(新功能)、NOTICE(通知)
     */
    val type: String?

    /**
     * 优先级：0-普通，1-重要，2-紧急
     */
    val priority: Int?

    /**
     * 是否启用
     */
    @Column(name = "is_active")
    val active: Int?

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

