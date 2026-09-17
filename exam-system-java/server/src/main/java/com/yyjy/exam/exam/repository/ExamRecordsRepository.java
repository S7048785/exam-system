package com.yyjy.exam.exam.repository;

import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.util.List;

public interface ExamRecordsRepository extends JRepository<ExamRecords, Integer> {
	
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
	
	List<ExamRecords> findByStatus(ExamRecordStatus status);
	
	default List<ExamRecords> findByUserId(long userId, Fetcher<ExamRecords> fetcher) {
		var t = Tables.EXAM_RECORDS_TABLE;
		return sql().createQuery(t)
				       .where(t.userId().eq(userId))
				       .orderBy(t.id().desc())
				       .select(t.fetch(fetcher)).execute();
	}
}
