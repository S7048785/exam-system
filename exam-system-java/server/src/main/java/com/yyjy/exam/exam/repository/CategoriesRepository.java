package com.yyjy.exam.exam.repository;

import com.yyjy.exam.entity.question.entity.Categories;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.List;

public interface CategoriesRepository extends JRepository<Categories, Long> {

    List<Categories> findByParentId(long parentId);

    boolean existsByParentId(long parentId);

    boolean existsByParentIdAndName(Long parentId, String name);
}
