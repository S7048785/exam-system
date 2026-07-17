package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperDraft;
import com.yyjy.exam.entity.paper.entity.PaperQuestionTable;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.time.LocalDateTime;
import java.util.List;

public interface PaperRepository extends JRepository<Paper, Integer> {
	
	boolean existsByName(String name);
	
	default boolean existsByNameAndIdNot(String name, Integer id) {
		PaperTable t = PaperTable.$;
		return sql().createQuery(t)
				       .where(t.name().eq(name))
				       .where(t.id().ne(id))
				       .select(t.count())
				       .fetchFirst() > 0;
	}
	
	default List<Paper> listByNameAndStatus(String name, Boolean ongoing, int page, int size, Fetcher<Paper> fetcher) {
		PaperTable paper = PaperTable.$;
		var query = sql().createQuery(paper);
		if (name != null && !name.isBlank()) {
			query = query.where(paper.name().like("%" + name + "%"));
		}
		if (ongoing != null) {
			query = query.where(paper.published().eq(ongoing));
		}
		return query.select(paper.fetch(fetcher)).limit(size, (long) (page - 1) * size).execute();
	}
	
	default List<Paper> listOngoing() {
		PaperTable paper = PaperTable.$;
		var now = LocalDateTime.now();
		return sql().createQuery(paper)
				       .where(paper.published().eq(true))
				       .where(paper.start().le(now))
				       .where(paper.end().gt(now))
				       .select(paper)
				       .execute();
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
		Double total = row.get_2() != null ? row.get_2() : 0.0;
		save(PaperDraft.$.produce(draft -> {
			draft.setId(paperId);
			draft.setQuestionCount(count);
			draft.setTotalScore(total);
		}), SaveMode.UPDATE_ONLY);
	}
}
