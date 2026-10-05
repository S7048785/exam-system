package com.yyjy.exam.exam.repository;

import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.entity.AnswerRecord;
import com.yyjy.exam.entity.question.entity.QuestionType;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.util.Collection;
import java.util.List;

public interface AnswerRecordRepository extends JRepository<AnswerRecord, Long> {
	
	List<AnswerRecord> findByExamRecordId(long examRecordId);

	/**
	 * 清掉某场考试的全部答案。
	 * <p>
	 * 保存答案是「先删后插」的全量覆盖（见 {@code ExamTakingService#saveAnswers}），
	 * 所以这里只需要按考试记录整批删——请求体里没有的题，答案就真的没了。
	 */
	default void deleteByExamRecordId(long examRecordId) {
		var t = Tables.ANSWER_RECORD_TABLE;
		sql().createDelete(t)
				.where(t.examRecordId().eq(examRecordId))
				.execute();
	}
	
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
	 * 简答题已批改部分的得分合计（**人工批改**写回之后才非 0，供后续人工批改接口累加）。
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
	
	/**
	 * 按 id 批量取答案（**带 fetch 图谱**）。
	 * <p>
	 * 人工判卷要读 `question.type` / `question.score` 才能算满分口径，而 `JRepository` 自带的
	 * `findById` 不带关联图谱，直接访问 `question().type()` 会抛 UnloadedException（同
	 * {@link #findByExamRecordId(long, Fetcher)} 的坑）。
	 *
	 * @param ids 答题记录 id 集合；空集合返回空列表（不发 SQL）
	 */
	default List<AnswerRecord> findByAnswerRecordIds(Collection<Long> ids, Fetcher<AnswerRecord> fetcher) {
		if (ids.isEmpty()) {
			return List.of();
		}
		var t = Tables.ANSWER_RECORD_TABLE;
		return sql().createQuery(t)
				       .where(t.id().in(ids))
				       .select(t.fetch(fetcher))
				       .execute();
	}
	
	/**
	 * 某场考试**全部**答案的得分合计（未判的 `score` 为 NULL，SUM 忽略 ⇒ 等价于 0 分）。
	 * <p>
	 * 人工判卷后重算 `exam_records.score` 用它，而不是「在旧分上累加本次得分」：
	 * 后者在老师改分（同一题判第二次）时会重复累加，整体重算天然幂等 ——
	 * 客观题小计本来就已写在各自的 `answer_record.score` 里。
	 */
	default int sumScoreByExamRecordId(long examRecordId) {
		var t = Tables.ANSWER_RECORD_TABLE;
		List<Integer> totals = sql().createQuery(t)
				                    .where(t.examRecordId().eq(examRecordId))
				                    .select(t.score().sum())
				                    .execute();
		Integer total = totals.isEmpty() ? null : totals.getFirst();
		return total == null ? 0 : total;
	}
	
	/**
	 * 某场考试还有多少条答案**没判**（`score` 为 NULL）。
	 * <p>
	 * 判卷收尾用：>0 ⇒ 记录保持 `GRADING`（还得继续判）；=0 ⇒ 可以置 `GRADED`。
	 */
	default long countUngradedByExamRecordId(long examRecordId) {
		var t = Tables.ANSWER_RECORD_TABLE;
		return sql().createQuery(t)
				       .where(t.examRecordId().eq(examRecordId))
				       .where(t.score().isNull())
				       .select(t.count())
				       .fetchFirst();
	}
}
