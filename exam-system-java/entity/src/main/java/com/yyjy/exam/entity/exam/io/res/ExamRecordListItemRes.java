package com.yyjy.exam.entity.exam.io.res;

import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;

import java.time.LocalDateTime;

/**
 * 成绩列表的一行（控制台：某份试卷下的全部考试记录）。
 * <p>
 * 关键口径（用户拍板）：
 * <ul>
 *   <li>{@code status} 为 {@link ExamRecordStatus#ONGOING}、或没有交卷时间（{@code endTime == null}）
 *       ⇒ {@code usedSeconds = 0}、{@code score = 0}；</li>
 *   <li>{@code rank} 为**顺序名次**（1,2,3…，不并列）：列表按成绩降序排列后的全局位置，
 *       由「分页偏移 + 页内下标」直接得出，不是数据库里的字段；</li>
 *   <li>{@code passingScore} 取 {@code paper_exam_settings.passing_score}（设置行缺失 → 0）；
 *       {@code totalScore} 取 {@code paper.total_score}（缺省 0）。</li>
 * </ul>
 *
 * @param id            考试记录 id（雪花 id，> JS 安全整数，故按字符串返回）
 * @param studentName   考生姓名
 * @param startTime     开始时间
 * @param endTime       交卷时间（未交卷为 null）
 * @param usedSeconds   用时（秒）；未交卷 → 0
 * @param passingScore  及格分
 * @param totalScore    试卷总分
 * @param score         成绩；未交卷 → 0
 * @param rank          顺序名次（从 1 开始）
 * @param status        状态：ONGOING=考试中 / GRADING=待批改 / GRADED=已批改
 */
public record ExamRecordListItemRes(
		String id,
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
