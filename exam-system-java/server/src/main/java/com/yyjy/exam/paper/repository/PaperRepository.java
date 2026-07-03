package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import com.yyjy.exam.paper.constant.PaperStatus;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

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

    default List<Paper> listByNameAndStatus(String name, PaperStatus status, Fetcher<Paper> fetcher) {
        PaperTable paper = PaperTable.$;
        var query = sql().createQuery(paper);
        if (name != null && !name.isBlank()) {
            query = query.where(paper.name().like("%" + name + "%"));
        }
        if (status != null) {
            query = query.where(paper.status().eq(status.getValue()));
        }
        return query.select(paper.fetch(fetcher)).execute();
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
}
