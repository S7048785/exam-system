package com.yyjy.exam.exam.repository;

import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.jetbrains.annotations.Nullable;

import java.util.List;

public interface ExamRecordsRepository extends JRepository<ExamRecords, Integer> {
	
	@Nullable
	ExamRecords findByPaperIdAndUserId(int paperId, Long userId);
	
	List<ExamRecords> findByStatus(ExamRecordStatus status);
	
	default List<ExamRecords> findByUserId(long userId, Fetcher<ExamRecords> fetcher) {
		var t = Tables.EXAM_RECORDS_TABLE;
		return sql().createQuery(t)
				       .where(t.userId().eq(userId))
				       .orderBy(t.id().desc())
				       .select(t.fetch(fetcher)).execute();
	}
}
