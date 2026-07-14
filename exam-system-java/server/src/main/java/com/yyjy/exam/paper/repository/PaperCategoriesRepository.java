package com.yyjy.exam.paper.repository;

import com.yyjy.exam.entity.paper.dto.PaperCategoriesTree;
import com.yyjy.exam.entity.paper.entity.PaperCategories;
import com.yyjy.exam.entity.paper.entity.PaperCategoriesTable;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.util.List;

public interface PaperCategoriesRepository extends JRepository<PaperCategories, Long> {

    List<PaperCategories> findByParentId(long parentId);

    boolean existsByParentId(long parentId);

    boolean existsByParentIdAndName(Long parentId, String name);

    default List<PaperCategoriesTree> findTree() {
        var t = PaperCategoriesTable.$;
        return sql().createQuery(t)
                .where(t.parentId().eq(0L))
                .orderBy(t.sort())
                .select(t.fetch(PaperCategoriesTree.class))
                .execute();
    }

    default boolean hasPapers(Long categoryId) {
        var pt = PaperTable.$;
        return !sql().createQuery(pt)
                .where(pt.categoryId().eq(categoryId))
                .select(pt)
                .limit(1)
                .execute()
                .isEmpty();
    }

    default List<PaperCategories> findAllWithFetcher(Fetcher<PaperCategories> fetcher) {
        return sql().getEntities().findAll(fetcher);
    }
}
