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
	
	/**
	 * 物理删除某份试卷的全部考试记录，**连带删掉它们的作答明细**。
	 * <p>
	 * 用于「撤回发布」：撤回后题目会被改，而判分读的是**当前题库**的正确答案与分值 ——
	 * 若保留旧记录，考生看到的历史成绩会与「按新卷判」的结果自相矛盾。直接销毁整场考试。
	 * <p>
	 * 库里没有任何外键约束，不显式删 {@code answer_record} 就会留孤儿。
	 * 所有状态都删（含 ONGOING）—— 撤回发布等于销毁这场考试。
	 *
	 * @return 被删掉的考试记录条数
	 */
	default int deleteByPaperId(int paperId) {
		var t = Tables.EXAM_RECORDS_TABLE;
		// ExamRecords.id() / AnswerRecord.examRecordId() 都是 int，故这里是 List<Integer>
		List<Integer> ids = sql().createQuery(t)
				                    .where(t.paperId().eq(paperId))
				                    .select(t.id())
				                    .execute();
		if (ids.isEmpty()) {
			return 0;
		}
		var at = Tables.ANSWER_RECORD_TABLE;
		// 先删子表再删主表，避免中途失败留下孤儿（同事务内，失败会整体回滚）
		sql().createDelete(at)
				       .where(at.examRecordId().in(ids))
				       .execute();
		sql().createDelete(t)
				       .where(t.paperId().eq(paperId))
				       .execute();
		return ids.size();
	}
}
