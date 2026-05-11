package com.yyjy.models.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

/**
 * 轮播图表（首页轮播图）
 */
@Entity
interface Banners {

    /**
     * 轮播图ID
     */
    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    /**
     * 轮播图标题
     */
    val title: String

    /**
     * 轮播图描述
     */
    val description: String?

    /**
     * 图片URL
     */
    val imageUrl: String

    /**
     * 跳转链接
     */
    val linkUrl: String?

    /**
     * 排序顺序
     */
    val sortOrder: Int?

    /**
     * 是否启用
     */
    @Column(name = "is_active")
    val active: Boolean?

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

