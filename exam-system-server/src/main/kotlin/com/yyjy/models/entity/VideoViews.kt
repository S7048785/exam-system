package com.yyjy.models.entity

import org.babyfish.jimmer.sql.Entity
import org.babyfish.jimmer.sql.Id
import org.babyfish.jimmer.sql.GeneratedValue
import org.babyfish.jimmer.sql.Key
import org.babyfish.jimmer.sql.GenerationType
import org.babyfish.jimmer.sql.ManyToOne
import java.time.LocalDateTime

/**
 * 视频观看记录表（观看统计）
 */
@Entity
interface VideoViews {

    /**
     * 观看ID
     */
    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    /**
     * 视频ID
     */
    @Key
    @ManyToOne
    val video: Videos

    /**
     * 用户IP
     */
    @Key
    val userIp: String

    /**
     * 用户代理信息
     */
    val userAgent: String?

    /**
     * 观看时长（秒）
     */
    val viewDuration: Int?

    /**
     * 观看时间
     */
    val createdAt: LocalDateTime?
}

