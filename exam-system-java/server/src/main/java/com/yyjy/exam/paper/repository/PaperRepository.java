package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperDraft;
import com.yyjy.exam.entity.paper.entity.PaperQuestionTable;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;

public interface PaperRepository extends JRepository<Paper, Integer> {
	
	/**
	 * 多用户改造：判重必须按 owner 作用域。
	 * 原派生方法 existsByName 是全局的，会误拒"别的用户用过同名试卷"，已删除。
	 */
	default boolean existsByUserIdAndName(long userId, String name) {
		PaperTable t = PaperTable.$;
		return !sql().createQuery(t)
				        .where(t.userId().eq(userId))
				        .where(t.name().eq(name))
				        .select(t.id())
				        .limit(1)
				        .execute()
				        .isEmpty();
	}
	
	default boolean existsByUserIdAndId(long userId, Integer id) {
		PaperTable t = PaperTable.$;
		return sql().createQuery(t)
				       .where(t.userId().eq(userId))
				       .where(t.id().eq(id))
				       .exists();
	}
	
	default PaperDetail findDetailById(int id) {
		PaperTable paper = PaperTable.$;
		return sql().createQuery(paper)
				       .where(paper.id().eq(id))
				       .select(paper.fetch(PaperDetail.class))
				       .fetchFirstOrNull();
	}
	
	default boolean hasExamRecords(int paperId) {
		ExamRecordsTable t = ExamRecordsTable.$;
		return !sql().createQuery(t)
				        .where(t.paperId().eq(paperId))
				        .select(t)
				        .limit(1)
				        .execute()
				        .isEmpty();
	}
	
	default void recalculateTotals(int paperId) {
		PaperQuestionTable t = PaperQuestionTable.$;
		var row = sql().createQuery(t)
				          .where(t.paperId().eq(paperId))
				          .select(t.count(), t.score().sum())
				          .fetchFirst();
		int count = row.get_1().intValue();
		int total = row.get_2() != null ? row.get_2() : 0;
		save(PaperDraft.$.produce(draft -> {
			draft.setId(paperId);
			draft.setQuestionCount(count);
			draft.setTotalScore(total);
		}), SaveMode.UPDATE_ONLY);
	}
	
	default boolean existsByNameAndUserIdAndIdNot(long me, String name, int id) {
		var t = PaperTable.$;
		return sql().createQuery(t)
				       .where(t.name().eq(name))
				       .where(t.userId().eq(me))
				       .where(t.id().ne(id))
				       .exists();
	}
}
