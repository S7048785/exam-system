package com.yyjy.exam.exam.repository;

import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.entity.AnswerRecord;
import com.yyjy.exam.entity.question.entity.QuestionType;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.util.List;

public interface AnswerRecordRepository extends JRepository<AnswerRecord, Long> {
	
	List<AnswerRecord> findByExamRecordId(long examRecordId);
	
	/**
	 * 带 fetch 图谱的版本：批改需要 question.type / question.score / question.questionAnswers.answer，
	 * 而上面的派生查询只带回关联对象的 id，直接访问 question().type() 会抛 UnloadedException。
	 */
	default List<AnswerRecord> findByExamRecordId(long examRecordId, Fetcher<AnswerRecord> fetcher) {
		var t = Tables.ANSWER_RECORD_TABLE;
		return sql().createQuery(t)
				       .where(t.examRecordId().eq(examRecordId))
				       .select(t.fetch(fetcher))
				       .execute();
	}
	
	/**
	 * 简答题已批改部分的得分合计（异步 AI 批改写回之后才非 0），
	 * 用于在「客观题小计」之上累加。未批改的题 score 为 NULL，SUM 会忽略（等价于 0 分）；
	 * Jimmer 的聚合查询固定返回一行，没有任何答案时该行是 NULL。
	 */
	default int sumTextScoreByExamRecordId(long examRecordId) {
		var t = Tables.ANSWER_RECORD_TABLE;
		List<Integer> totals = sql().createQuery(t)
				                    .where(t.examRecordId().eq(examRecordId))
				                    .where(t.question().type().eq(QuestionType.TEXT))
				                    .select(t.score().sum())
				                    .execute();
		Integer total = totals.isEmpty() ? null : totals.getFirst();
		return total == null ? 0 : total;
	}
}
