package com.yyjy.exam.entity.paper.entity;

/**
 * @author Nyxcirea
 * @date 2026/9/23
 */
public enum PaperStatus {
	/* 草稿 未发布 */
	DRAFT,
	/* 未开始 已发布，但未到考试时间 */
	PENDING,
	/* 进行中 已发布，且考试进行中 */
	PUBLISHED,
	/* 已结束 已发布，且考试结束后 */
	FINISHED
}
