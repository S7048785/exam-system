package com.yyjy.exam.entity.exam.io.res;

import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;

import java.time.LocalDateTime;

/**
 * 成绩列表的一行（控制台：某份试卷下的全部考试记录）。
 *
 * @param publicId     考试记录对外标识（6 位短码；自增 id 不对外）
 * @param studentName  考生姓名
 * @param startTime    开始时间
 * @param endTime      交卷时间（未交卷为 null）
 * @param usedSeconds  用时（秒）；未交卷 → 0
 * @param passingScore 及格分
 * @param totalScore   试卷总分
 * @param score        成绩；未交卷 → 0
 * @param rank         顺序名次（从 1 开始）
 * @param status       状态：ONGOING=考试中 / GRADING=待批改 / GRADED=已批改
 */
public record ExamRecordListItemRes(
		String publicId,
		String studentName,
		LocalDateTime startTime,
		LocalDateTime endTime,
		long usedSeconds,
		int passingScore,
		int totalScore,
		int score,
		int rank,
		ExamRecordStatus status
) {
}
