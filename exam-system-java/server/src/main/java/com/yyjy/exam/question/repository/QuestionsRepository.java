package com.yyjy.exam.question.repository;

import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.entity.QuestionsTable;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.Collection;
import java.util.List;

public interface QuestionsRepository extends JRepository<Questions, Long> {
	
	/**
	 * 多用户改造：判重必须按 owner 作用域。
	 * 原全局派生方法 existsByTypeAndTitle 已删除（它会误拒"别的用户用过同名题目"）。
	 * 不用派生方法是因为 Questions 没声明 @IdView userId()，Table.userId() 才是可用入口。
	 */
	default boolean existsByUserIdAndTypeAndTitle(long userId, QuestionType type, String title) {
		return existsByUserIdAndTypeAndTitleExcludingId(userId, type, title, 0L);
	}
	
	/**
	 * 同上，但排除指定 id。
	 * 更新题目时若不改标题，按"同 owner + 同类型 + 同标题"判重会命中题目自己 → 必须排除自身。
	 */
	default boolean existsByUserIdAndTypeAndTitleExcludingId(long userId, QuestionType type, String title, long excludeId) {
		QuestionsTable t = QuestionsTable.$;
		var query = sql().createQuery(t)
				            .where(t.userId().eq(userId))
				            .where(t.type().eq(type))
				            .where(t.title().eq(title));
		if (excludeId > 0L) {
			query = query.where(t.id().ne(excludeId));
		}
		return !query.select(t.id())
				        .limit(1)
				        .execute()
				        .isEmpty();
	}
	
	/**
	 * 一批题目是否**全部**属于该用户。
	 * 用于「把题目加进自己的试卷」这类批量场景 —— 否则用户 A 可以把自己的试卷里塞进用户 B 的题，
	 * 再通过 GET /paper/{id}（含答案与解析）把 B 的题连答案一起读走。
	 */
	default boolean allOwnedBy(long userId, Collection<Long> ids) {
		List<Long> distinct = ids.stream().distinct().toList();
		if (distinct.isEmpty()) {
			return true;
		}
		QuestionsTable t = QuestionsTable.$;
		long owned = sql().createQuery(t)
				            .where(t.id().in(distinct))
				            .where(t.userId().eq(userId))
				            .select(t.count())
				            .fetchFirst();
		return owned == distinct.size();
	}
	
	/**
	 * 多用户改造：必须限定 owner。
	 * 原来这里是全局查询 → 用户 B 用「智能组卷」会把自己卷子里掺进用户 A 的题，
	 * 而 `GET /paper/{id}` 返回的 PaperDetail 含选项 correct 与答案 → 等于把 A 的题连答案一起读走。
	 */
	default List<Long> findIdsByTypeAndCategoryIds(long userId, QuestionType type, List<Long> categoryIds) {
		QuestionsTable t = QuestionsTable.$;
		return sql().createQuery(t)
				       .where(t.userId().eq(userId))
				       .where(t.type().eq(type))
				       .where(t.categoryId().in(categoryIds))
				       .select(t.id())
				       .execute();
	}
}
