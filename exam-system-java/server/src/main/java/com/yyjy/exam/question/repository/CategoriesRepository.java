package com.yyjy.exam.question.repository;

import com.yyjy.exam.entity.question.dto.QuestionsCategoriesTree;
import com.yyjy.exam.entity.question.entity.QuestionsCategories;
import com.yyjy.exam.entity.question.entity.QuestionsCategoriesTable;
import com.yyjy.exam.entity.question.entity.QuestionsTable;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.util.List;

public interface CategoriesRepository extends JRepository<QuestionsCategories, Long> {
	
	List<QuestionsCategories> findByParentId(long parentId);
	
	boolean existsByParentId(long parentId);
	
	/**
	 * 多用户改造：判重必须按 owner 作用域。
	 * 原全局方法 existsByParentIdAndName 已删除（无调用点，且会误拒"别的用户建同名分类"）。
	 * DB 唯一索引已经是 (user_id, parent_id, name)，这里与它对齐。
	 */
	default boolean existsByUserIdAndParentIdAndName(long userId, long parentId, String name) {
		var t = QuestionsCategoriesTable.$;
		return !sql().createQuery(t)
				       .where(t.userId().eq(userId))
				       .where(t.parentId().eq(parentId))
				       .where(t.name().eq(name))
				       .select(t.id())
				       .limit(1)
				       .execute()
				       .isEmpty();
	}
	
	/** 同上，但排除自身。更新时用，避免"没改名却被自己拦住"。 */
	default boolean existsByUserIdAndParentIdAndNameExcludingId(
			long userId, long parentId, String name, long excludeId) {
		var t = QuestionsCategoriesTable.$;
		return !sql().createQuery(t)
				       .where(t.userId().eq(userId))
				       .where(t.parentId().eq(parentId))
				       .where(t.name().eq(name))
				       .where(t.id().ne(excludeId))
				       .select(t.id())
				       .limit(1)
				       .execute()
				       .isEmpty();
	}
	
	/** 归属校验。分类表已改为**硬删除**（deleted_at 已于 2026-09-17 移除），不再有软删除过滤。 */
	default boolean ownedBy(long categoryId, long userId) {
		var t = QuestionsCategoriesTable.$;
		return !sql().createQuery(t)
				       .where(t.id().eq(categoryId))
				       .where(t.userId().eq(userId))
				       .select(t.id())
				       .limit(1)
				       .execute()
				       .isEmpty();
	}
	
	/** 只取该用户的根节点；子节点由关联递归取（同一用户的树内）。 */
	default List<QuestionsCategoriesTree> findTree(long userId) {
		var t = QuestionsCategoriesTable.$;
		List<QuestionsCategoriesTree> items = sql().createQuery(t)
				                                      .where(t.userId().eq(userId))
				                                      .where(t.parentId().eq(0L))
				                                      .orderBy(t.sort())
				                                      .select(t.fetch(QuestionsCategoriesTree.class))
				                                      .execute();
		calculateCount(items);
		return items;
	}
	
	default int calculateCount(List<QuestionsCategoriesTree> categories) {
		int total = 0;
		for (var node : categories) {
			List<QuestionsCategoriesTree> children = node.getChildren();
			if (children == null || children.isEmpty()) {
				total += node.getQuestionCount();
			} else {
				int childrenSum = calculateCount(children);
				node.setQuestionCount(childrenSum);
				total += childrenSum;
			}
		}
		return total;
	}
	
	default boolean hasQuestions(Long categoryId) {
		QuestionsTable qt = QuestionsTable.$;
		return !sql().createQuery(qt)
				        .where(qt.categoryId().eq(categoryId))
				        .select(qt)
				        .limit(1)
				        .execute()
				        .isEmpty();
	}
	
	/** 多用户改造：原来 getEntities().findAll(fetcher) 会返回**所有用户**的分类。 */
	default List<QuestionsCategories> findAllByUserWithFetcher(long userId, Fetcher<QuestionsCategories> fetcher) {
		var t = QuestionsCategoriesTable.$;
		return sql().createQuery(t)
				       .where(t.userId().eq(userId))
				       .orderBy(t.sort())
				       .select(t.fetch(fetcher))
				       .execute();
	}
}
