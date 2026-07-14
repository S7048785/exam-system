package com.yyjy.exam.entity.paper.entity;

import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 试卷分类表（独立于试题分类）
 */
@Entity
public interface PaperCategories {
	
	/**
	 * 分类ID
	 */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY
	)
	long id();
	
	/**
	 * 分类名称
	 */
	@Key
	String name();
	
	/**
	 * 父分类ID，0表示根节点
	 */
	@ManyToOne
	PaperCategories parent();
	
	@IdView
	long parentId();
	
	@OneToMany(mappedBy = "parent")
	List<PaperCategories> children();
	
	/**
	 * 排序权重，数值越小越靠前
	 */
	int sort();
	
	/**
	 * 分类描述
	 */
	@Nullable
	String description();
	
	/**
	 * 创建时间
	 */
	@Nullable
	LocalDateTime createTime();
	
	/**
	 * 更新时间
	 */
	@Nullable
	LocalDateTime updateTime();
	
	/**
	 * 软删除时间，NULL表示未删除
	 */
	@Column(name = "deleted_at")
	@LogicalDeleted("now")
	@Nullable
	LocalDateTime delFlag();
}

