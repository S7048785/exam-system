package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import org.babyfish.jimmer.spring.repository.JRepository;

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
}
