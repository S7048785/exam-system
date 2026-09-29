package com.yyjy.exam.exam.repository;

import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.util.List;

public interface ExamRecordsRepository extends JRepository<ExamRecords, Long> {
	
	/**
	 * 该「考生名」在这份试卷上已经开考的次数。
	 * 口径由用户指定：**按 `student_name` 计数**（匿名考生没有 `user_id`，只有名字可用）。
	 * 软删除的记录不计（Jimmer 的 `@LogicalDeleted` 自动加 `deleted_at is null`），所有状态都计。
	 */
	default long countByPaperIdAndStudentName(int paperId, String studentName) {
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
	default long countByPaperIdAndUserId(int paperId, long userId) {
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
	default ExamRecords findOngoingByPaperIdAndStudentName(int paperId, String studentName) {
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
	default ExamRecords findOngoingByPaperIdAndUserId(int paperId, long userId) {
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
}
