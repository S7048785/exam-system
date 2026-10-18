package com.yyjy.exam.entity.exam.io.res;

import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;

import java.time.LocalDateTime;

/**
 * 考生自己的考试记录（`GET /exams/history` 的一行）。
 * <p>
 * 对外标识是 {@code publicId}：自增 id 只作数据库主键，不再返回给前端。
 *
 * @param publicId    考试记录对外标识（6 位短码）
 * @param paperId     试卷 id（前端按它筛出「我在这张卷上的记录」）
 * @param paperName   试卷名称（历史成绩列表直接展示，不用再逐条查试卷）
 * @param studentName 考生姓名
 * @param score       成绩（未交卷为 null）
 * @param startTime   开始时间
 * @param endTime     交卷时间（未交卷为 null）
 * @param status      状态：ONGOING=考试中 / GRADING=待批改 / GRADED=已批改
 */
public record ExamHistoryItemRes(
		String publicId,
		long paperId,
		String paperName,
		String studentName,
		Integer score,
		LocalDateTime startTime,
		LocalDateTime endTime,
		ExamRecordStatus status
) {
}
