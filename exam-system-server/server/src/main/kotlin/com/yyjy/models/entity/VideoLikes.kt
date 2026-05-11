package com.yyjy.models.entity

import org.babyfish.jimmer.sql.Entity
import org.babyfish.jimmer.sql.Id
import org.babyfish.jimmer.sql.GeneratedValue
import org.babyfish.jimmer.sql.Key
import org.babyfish.jimmer.sql.GenerationType
import org.babyfish.jimmer.sql.ManyToOne
import java.time.LocalDateTime

/**
 * 视频点赞表
 */
@Entity
interface VideoLikes {

    /**
     * 点赞ID
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
    val video: com.yyjy.models.entity.Videos

    /**
     * 用户IP（匿名点赞）
     */
    @Key
    val userIp: String

    /**
     * 用户代理信息
     */
    val userAgent: String?

    /**
     * 点赞时间
     */
    val createdAt: LocalDateTime?
}

