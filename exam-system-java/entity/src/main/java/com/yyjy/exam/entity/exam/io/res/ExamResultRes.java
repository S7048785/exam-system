package com.yyjy.exam.entity.exam.io.res;

import java.time.LocalDateTime;

/**
 * 考试结果（**考生侧**，凭 `publicId` 查看，免登录）。
 * <p>
 * 口径：
 * <ul>
 *   <li>只有 {@code GRADED} 的记录能看到，其余状态接口层直接 422「试卷未提交」；</li>
 *   <li>{@code usedSeconds} = `endTime - startTime`，并**封顶**在 {@code duration × 60} ——
 *       超时强制交卷的记录不会显示成「用时比考试时长还长」；</li>
 *   <li>{@code totalScore} 取 `paper.total_score`；{@code passingScore} 取
 *       `paper_exam_settings.passing_score`（设置行缺失按 0）。</li>
 * </ul>
 *
 * @param paperName    试卷名称
 * @param score        考试成绩
 * @param usedSeconds  用时（秒，已封顶）
 * @param endTime      交卷时间
 * @param totalScore   试卷总分
 * @param passingScore 及格分
 */
public record ExamResultRes(
		String paperName,
		int score,
		long usedSeconds,
		LocalDateTime endTime,
		int totalScore,
		int passingScore
) {
}
