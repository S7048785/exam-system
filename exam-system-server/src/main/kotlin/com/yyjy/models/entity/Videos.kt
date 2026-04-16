package com.yyjy.models.entity

import org.babyfish.jimmer.sql.Entity
import org.babyfish.jimmer.sql.Id
import org.babyfish.jimmer.sql.GeneratedValue
import org.babyfish.jimmer.sql.Key
import org.babyfish.jimmer.sql.GenerationType
import org.babyfish.jimmer.sql.ManyToOne
import java.time.LocalDateTime

/**
 * 视频表（视频基本信息）
 */
@Entity
interface Videos {

    /**
     * 视频ID
     */
    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    /**
     * 视频标题
     */
    val title: String

    /**
     * 视频描述
     */
    val description: String?

    /**
     * 分类
     */
    @Key
    @ManyToOne
    val category: VideoCategories

    /**
     * 视频文件URL
     */
    val fileUrl: String

    /**
     * 封面图片URL
     */
    val coverUrl: String?

    /**
     * 视频时长（秒）
     */
    val duration: Int?

    /**
     * 文件大小（字节）
     */
    val fileSize: Long?

    /**
     * 上传者名称
     */
    val uploaderName: String

    /**
     * 上传者类型：1-用户投稿，2-管理员上传
     */
    val uploaderType: Int?

    /**
     * 上传用户ID（用户投稿时）
     */
    @ManyToOne
    val user: Users?

    /**
     * 管理员ID（管理员上传时）
     */
    @ManyToOne
    val admin: Users?

    /**
     * 状态：0-待审核，1-已发布，2-已拒绝，3-已下架
     */
    val status: Int?

    /**
     * 审核管理员ID
     */
    @ManyToOne
    val auditAdmin: Users?

    /**
     * 审核时间
     */
    val auditTime: LocalDateTime?

    /**
     * 审核原因（拒绝时）
     */
    val auditReason: String?

    /**
     * 观看次数
     */
    val viewCount: Long?

    /**
     * 点赞次数
     */
    val likeCount: Long?

    /**
     * 标签，逗号分隔
     */
    val tags: String?

    /**
     * 创建时间
     */
    val createdAt: LocalDateTime?

    /**
     * 更新时间
     */
    val updatedAt: LocalDateTime?
}

