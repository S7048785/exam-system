package com.yyjy.exam.entity.exam.io.res;

/**
 * 试卷成绩统计（控制台：表格上方的汇总数字）。
 * <p>
 * 口径（用户拍板，2026-10-03）：
 * <ul>
 *   <li><b>范围 = 该卷全部考试记录</b>（含考试中 / 待批改），且<b>不受姓名筛选影响</b>；</li>
 *   <li>每条记录的分值取「列表里展示的成绩」：状态为 ONGOING 或没有交卷时间 ⇒ 0，
 *       否则取 {@code exam_records.score}（待批改 = 客观题小计，未定稿也照样计入）；</li>
 *   <li>及格判据 = `成绩 >= 及格分`（及格分取 {@code paper_exam_settings.passing_score}，
 *       设置行缺失按 0）⇒ 及格分 0 的卷会「全部及格、不及格 0 次」，这是数据本身如此；</li>
 *   <li>{@code participantCount = passCount + failCount} 恒成立（全部记录都参与判定）；</li>
 *   <li>无任何记录时各项均为 0。</li>
 * </ul>
 *
 * @param participantCount 参与人数（该卷考试记录总数）
 * @param passCount        及格次数（成绩 &gt;= 及格分）
 * @param failCount        不及格次数（成绩 &lt; 及格分）
 * @param maxScore         最高分（无记录时 0）
 * @param avgScore         平均分（**原始值，不四舍五入**，展示层自行保留小数位）
 * @param minScore         最低分（无记录时 0）
 */
public record ExamRecordStatsRes(
		int participantCount,
		int passCount,
		int failCount,
		int maxScore,
		double avgScore,
		int minScore
) {
}
