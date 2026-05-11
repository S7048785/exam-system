package com.yyjy.models.entity

import org.babyfish.jimmer.sql.Entity
import org.babyfish.jimmer.sql.Id
import org.babyfish.jimmer.sql.GeneratedValue
import org.babyfish.jimmer.sql.GenerationType
import org.babyfish.jimmer.sql.ManyToOne
import java.time.LocalDateTime

/**
 * 视频分类表（视频分类体系）
 */
@Entity
interface VideoCategories {

    /**
     * 分类ID
     */
    @Id
    @GeneratedValue(
        strategy = GenerationType.IDENTITY
    )
    val id: Long

    /**
     * 分类名称
     */
    val name: String

    /**
     * 分类描述
     */
    val description: String?

    /**
     * 父级分类ID，0为顶级
     */
    @ManyToOne
    val parent: com.yyjy.models.entity.VideoCategories?

    /**
     * 排序权重
     */
    val sortOrder: Int?

    /**
     * 状态：1-启用，0-禁用
     */
    val status: Int?

    /**
     * 创建时间
     */
    val createdAt: LocalDateTime?

    /**
     * 更新时间
     */
    val updatedAt: LocalDateTime?
}

