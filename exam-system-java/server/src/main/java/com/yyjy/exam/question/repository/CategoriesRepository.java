package com.yyjy.exam.question.repository;

import com.yyjy.exam.entity.question.dto.CategoriesTree;
import com.yyjy.exam.entity.question.entity.Categories;
import com.yyjy.exam.entity.question.entity.CategoriesTable;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.List;

public interface CategoriesRepository extends JRepository<Categories, Long> {

    List<Categories> findByParentId(long parentId);

    boolean existsByParentId(long parentId);

    boolean existsByParentIdAndName(Long parentId, String name);

    default List<CategoriesTree> findTree() {
        CategoriesTable t = CategoriesTable.$;
        List<CategoriesTree> items = sql().createQuery(t)
                .where(t.parentId().eq(0L))
                .orderBy(t.sort())
                .select(t.fetch(CategoriesTree.class))
                .execute();
        calculateCount(items);
        return items;
    }

    default int calculateCount(List<CategoriesTree> categories) {
        int total = 0;
        for (CategoriesTree node : categories) {
            List<CategoriesTree> children = node.getChildren();
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
}
