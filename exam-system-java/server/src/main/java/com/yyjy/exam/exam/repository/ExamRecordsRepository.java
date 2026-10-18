package com.yyjy.exam.exam.repository;

import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.dto.ExamStats;
import com.yyjy.exam.entity.exam.dto.ExamStatsMapper;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.ast.Expression;
import org.babyfish.jimmer.sql.ast.Predicate;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ExamRecordsRepository extends JRepository<ExamRecords, Long> {
	
	/**
	 * 按对外短码查一条记录（`public_id` 唯一）。
	 * <p>
	 * 对外接口**一律走这里**：自增 id 只是数据库主键，不出现在任何请求/响应里。
	 */
	default Optional<ExamRecords> findByPublicId(String publicId) {
		return findByPublicId(publicId, null);
	}
	
	/**
	 * 同上，但指定取数图谱（需要 `paper.examSettings` 这类关联时用）。
	 *
	 * @param fetcher 取数图谱；传 `null` 表示只取实体默认标量字段
	 */
	default Optional<ExamRecords> findByPublicId(String publicId, Fetcher<ExamRecords> fetcher) {
		if (publicId == null || publicId.isBlank()) {
			return Optional.empty();
		}
		var t = Tables.EXAM_RECORDS_TABLE;
		var query = sql().createQuery(t).where(t.publicId().eq(publicId));
		List<ExamRecords> rows = (fetcher == null ? query.select(t) : query.select(t.fetch(fetcher)))
				                         .limit(1)
				                         .execute();
		return rows.isEmpty() ? Optional.empty() : Optional.of(rows.getFirst());
	}
	
	/**
	 * 该「考生名」在这份试卷上已经开考的次数。
	 * 口径由用户指定：**按 `student_name` 计数**（匿名考生没有 `user_id`，只有名字可用）。
	 * 软删除的记录不计（Jimmer 的 `@LogicalDeleted` 自动加 `deleted_at is null`），所有状态都计。
	 */
	default long countByPaperIdAndStudentName(long paperId, String studentName) {
		var t = Tables.EXAM_RECORDS_TABLE;
		return sql().createQuery(t)
				       .where(t.paperId().eq(paperId))
				       .where(t.studentName().eq(studentName))
				       .select(t.count())
				       .fetchFirst();
	}
	
	/**
	 * 同上，但按 `user_id` 计数（**账号登录考试**用）。
	 * 与按姓名计数互补：登录考生的 `user_id` 是确定的，改 `student_name` 绕不过去。
	 */
	default long countByPaperIdAndUserId(long paperId, long userId) {
		var t = Tables.EXAM_RECORDS_TABLE;
		return sql().createQuery(t)
				       .where(t.paperId().eq(paperId))
				       .where(t.userId().eq(userId))
				       .select(t.count())
				       .fetchFirst();
	}
	
	/**
	 * 该「考生名」在这份试卷上**还没结束**（`ONGOING`）的那条记录 —— 说明上次开考中途退出了，
	 * 再进来应当**续考**（拿它的 id 继续作答），而不是新开一场。多条时取最新一条（id 最大）。
	 * <p>
	 * 返回整个实体（而不是 id）：调用方还要看 `startTime` 判断这场有没有超时。
	 *
	 * @return 没有进行中的记录时返回 {@code null}
	 */
	default ExamRecords findOngoingByPaperIdAndStudentName(long paperId, String studentName) {
		var t = Tables.EXAM_RECORDS_TABLE;
		List<ExamRecords> rows = sql().createQuery(t)
				                         .where(t.paperId().eq(paperId))
				                         .where(t.studentName().eq(studentName))
				                         .where(t.status().eq(ExamRecordStatus.ONGOING))
				                         .orderBy(t.id().desc())
				                         .select(t)
				                         .limit(1)
				                         .execute();
		return rows.isEmpty() ? null : rows.getFirst();
	}
	
	/**
	 * 同上，但按 `user_id` 查（**账号登录考试**用）。
	 *
	 * @return 没有进行中的记录时返回 {@code null}
	 */
	default ExamRecords findOngoingByPaperIdAndUserId(long paperId, long userId) {
		var t = Tables.EXAM_RECORDS_TABLE;
		List<ExamRecords> rows = sql().createQuery(t)
				                         .where(t.paperId().eq(paperId))
				                         .where(t.userId().eq(userId))
				                         .where(t.status().eq(ExamRecordStatus.ONGOING))
				                         .orderBy(t.id().desc())
				                         .select(t)
				                         .limit(1)
				                         .execute();
		return rows.isEmpty() ? null : rows.getFirst();
	}
	
	List<ExamRecords> findByStatus(ExamRecordStatus status);
	
	default List<ExamRecords> findByUserId(long userId, Fetcher<ExamRecords> fetcher) {
		var t = Tables.EXAM_RECORDS_TABLE;
		return sql().createQuery(t)
				       .where(t.userId().eq(userId))
				       .orderBy(t.id().desc())
				       .select(t.fetch(fetcher)).execute();
	}
	
	/**
	 * 批量取「试卷 id → 交卷 / 未评 / 已评次数」，给试卷考试报表用（见 {@code PaperService#listPaperReports}）。
	 * 返回的 Map **只含至少有一条记录的卷**：没有记录的卷不会出现，调用方按 0 兜底。
	 *
	 * @param paperIds 试卷 id 集合；空集合直接返回空 Map（不发 SQL）
	 */
	default Map<Long, ExamStats> countStatsByPaperIds(Collection<Long> paperIds) {
		if (paperIds.isEmpty()) {
			return Map.of();
		}
		var t = Tables.EXAM_RECORDS_TABLE;
		// 条件计数：Jimmer 没有 sumIf，用 sum(case when 条件 then 1 else 0 end)
		Predicate submitted = t.status().in(List.of(ExamRecordStatus.GRADING, ExamRecordStatus.GRADED));
		Predicate grading = t.status().eq(ExamRecordStatus.GRADING);
		Predicate graded = t.status().eq(ExamRecordStatus.GRADED);
		
		Map<Long, ExamStats> result = new HashMap<>();
		for (ExamStats row : sql().createQuery(t)
				                     .where(t.paperId().in(paperIds))
				                     .groupBy(t.paperId())
				                     .select(ExamStatsMapper
						                             .paperId(t.paperId())
						                             .submittedCount(Expression.numeric().caseBuilder(Long.class)
								                                             .when(submitted, 1L).otherwise(0L).sum())
						                             .gradingCount(Expression.numeric().caseBuilder(Long.class)
								                                           .when(grading, 1L).otherwise(0L).sum())
						                             .gradedCount(Expression.numeric().caseBuilder(Long.class)
								                                          .when(graded, 1L).otherwise(0L).sum()))
				                     .execute()) {
			result.put(row.getPaperId(), row);
		}
		return result;
	}
}
