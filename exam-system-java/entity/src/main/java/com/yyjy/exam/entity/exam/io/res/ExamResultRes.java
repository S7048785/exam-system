package com.yyjy.exam.entity.exam.io.res;

import java.time.LocalDateTime;

/**
 * 考试结果（**考生侧**，凭 `publicId` 查看，免登录）。
 *
 * @param paperId      试卷 id（历史成绩列表按它过滤「当前试卷」）
 * @param paperName    试卷名称
 * @param score        考试成绩
 * @param usedSeconds  用时（秒，已封顶）
 * @param endTime      交卷时间
 * @param totalScore   试卷总分
 * @param passingScore 及格分
 */
public record ExamResultRes(
		long paperId,
		String paperName,
		int score,
		long usedSeconds,
		LocalDateTime endTime,
		int totalScore,
		int passingScore
) {
}
