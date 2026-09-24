package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.paper.entity.PaperExamSettings;
import com.yyjy.exam.entity.paper.entity.PaperExamSettingsTable;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public interface PaperExamSettingsRepository extends JRepository<PaperExamSettings, Integer> {
	
	/**
	 * 取某份试卷的考试设置（与 `paper` 1:1）；没有对应行时返回 null。
	 */
	default PaperExamSettings findByPaperId(int paperId) {
		PaperExamSettingsTable t = PaperExamSettingsTable.$;
		return sql().createQuery(t)
				       .where(t.paper().id().eq(paperId))
				       .select(t)
				       .fetchFirstOrNull();
	}
	
	/**
	 * 批量取「试卷 id → 考试时长（分钟）」，给超时扫描用（时长现在在设置表里）。
	 */
	default Map<Integer, Integer> findDurationMapByPaperIds(Collection<Integer> paperIds) {
		if (paperIds.isEmpty()) {
			return Map.of();
		}
		PaperExamSettingsTable t = PaperExamSettingsTable.$;
		Map<Integer, Integer> result = new HashMap<>();
		for (var tuple : sql().createQuery(t)
				.where(t.paper().id().in(paperIds))
				.select(t.paper().id(), t.duration())
				.execute()) {
			result.put(tuple.get_1(), tuple.get_2());
		}
		return result;
	}
}
