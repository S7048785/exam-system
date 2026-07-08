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
	
	boolean existsByParentIdAndName(Long parentId, String name);
	
	default List<QuestionsCategoriesTree> findTree() {
		var t = QuestionsCategoriesTable.$;
		List<QuestionsCategoriesTree> items = sql().createQuery(t)
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
	
	default List<QuestionsCategories> findAllWithFetcher(Fetcher<QuestionsCategories> fetcher) {
		return sql().getEntities().findAll(fetcher);
	}
}
