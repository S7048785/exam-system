package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.paper.entity.PaperQuestion;
import com.yyjy.exam.entity.paper.entity.PaperQuestionTable;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public interface PaperQuestionRepository extends JRepository<PaperQuestion, Integer> {
	
	default void deleteByPaperId(long paperId) {
		PaperQuestionTable t = PaperQuestionTable.$;
		sql().createDelete(t)
				.where(t.paperId().eq(paperId))
				.execute();
	}
	
	default PaperQuestion findByPaperIdAndQuestionId(long paperId, long questionId) {
		PaperQuestionTable t = PaperQuestionTable.$;
		return sql().createQuery(t)
				       .where(t.paperId().eq(paperId))
				       .where(t.questionId().eq(questionId))
				       .select(t)
				       .fetchFirstOrNull();
	}
	
	default void deleteByPaperIdAndQuestionId(long paperId, long questionId) {
		PaperQuestionTable t = PaperQuestionTable.$;
		sql().createDelete(t)
				.where(t.paperId().eq(paperId))
				.where(t.questionId().eq(questionId))
				.execute();
	}
	
	/**
	 * 删除某道题目在**所有试卷**中的引用（题库侧删题时用）。
	 * 返回受影响的试卷 id，调用方据此重算 paper 的冗余列。
	 */
	default List<Long> deleteByQuestionId(long questionId) {
		PaperQuestionTable t = PaperQuestionTable.$;
		List<Long> paperIds = findPaperIdsByQuestionId(questionId);
		if (paperIds.isEmpty()) {
			return List.of();
		}
		sql().createDelete(t)
				.where(t.questionId().eq(questionId))
				.execute();
		return paperIds;
	}
	
	/**
	 * 引用了该题目的试卷 id 列表（去重）。
	 */
	default List<Long> findPaperIdsByQuestionId(long questionId) {
		PaperQuestionTable t = PaperQuestionTable.$;
		return sql().createQuery(t)
				       .where(t.questionId().eq(questionId))
				       .select(t.paperId())
				       .distinct()
				       .execute();
	}
	
	/**
	 * 该试卷的题目 id 列表，**按 `paper_question.id` 升序**（= 题目加进试卷的先后）。
	 * <p>
	 * `paper_question` 没有排序列、Jimmer 取数也不带 ORDER BY，所以需要稳定题号的地方
	 * （如答题详情页）用这个顺序排一遍。
	 */
	default List<Long> findOrderedQuestionIdsByPaperId(long paperId) {
		PaperQuestionTable t = PaperQuestionTable.$;
		return sql().createQuery(t)
				       .where(t.paperId().eq(paperId))
				       .orderBy(t.id().asc())
				       .select(t.questionId())
				       .execute();
	}
	
	/**
	 * 该试卷的题目集（questionId → 分值），用于比对提交上来的题目是否与库中一致
	 * （已发布的试卷只允许改元数据、不允许动题目）。
	 */
	default Map<Long, Integer> findScoreMapByPaperId(long paperId) {
		PaperQuestionTable t = PaperQuestionTable.$;
		Map<Long, Integer> result = new HashMap<>();
		for (var tuple : sql().createQuery(t)
				                 .where(t.paperId().eq(paperId))
				                 .select(t.questionId(), t.score())
				                 .execute()) {
			result.put(tuple.get_1(), tuple.get_2());
		}
		return result;
	}
}
