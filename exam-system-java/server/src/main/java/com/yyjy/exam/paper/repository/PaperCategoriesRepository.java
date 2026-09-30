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

    /**
     * 该用户有没有任意分类（根或子都算）。
     * 懒建默认根分类时用来判断「一条都没有」——用 name 判重不行：
     * 用户自建了别的分类但没建根分类时，也该给他补一个。
     */
    default boolean existsByUserId(long userId) {
        var t = PaperCategoriesTable.$;
        return !sql().createQuery(t)
                .where(t.userId().eq(userId))
                .select(t.id())
                .limit(1)
                .execute()
                .isEmpty();
    }

    /**
     * 多用户改造：判重必须按 owner 作用域。
     * 原全局方法 existsByParentIdAndName 已删除（无调用点，且会误拒"别的用户建同名分类"）。
     * DB 唯一索引已经是 (user_id, parent_id, name)，这里与它对齐。
     */
    default boolean existsByUserIdAndParentIdAndName(long userId, long parentId, String name) {
        var t = PaperCategoriesTable.$;
        return !sql().createQuery(t)
                .where(t.userId().eq(userId))
                .where(t.parentId().eq(parentId))
                .where(t.name().eq(name))
                .select(t.id())
                .limit(1)
                .execute()
                .isEmpty();
    }

    /** 同上，但排除自身。更新时用，避免"没改名却被自己拦住"。 */
    default boolean existsByUserIdAndParentIdAndNameExcludingId(
            long userId, long parentId, String name, long excludeId) {
        var t = PaperCategoriesTable.$;
        return !sql().createQuery(t)
                .where(t.userId().eq(userId))
                .where(t.parentId().eq(parentId))
                .where(t.name().eq(name))
                .where(t.id().ne(excludeId))
                .select(t.id())
                .limit(1)
                .execute()
                .isEmpty();
    }

    /**
     * 取某条分类**当前**的父 id（0 = 它自己就是根）。用于判断一次更新是不是「把子分类挪到根级」。
     * <p>
     * 单独开一条只选 parentId 的查询，而不是 load 实体再读 {@code parentId()}：
     * 后者会把 {@code parent} 关联一起加载，而根分类的 parent_id = 0 在表里根本没有对应行。
     *
     * @return 该用户下不存在这条分类时返回 -1
     */
    default long currentParentId(long categoryId, long userId) {
        var t = PaperCategoriesTable.$;
        Long parentId = sql().createQuery(t)
                .where(t.id().eq(categoryId))
                .where(t.userId().eq(userId))
                .select(t.parentId())
                .fetchFirstOrNull();
        return parentId == null ? -1L : parentId;
    }

    /**
     * 删除该用户的**全部**分类（含子分类）。
     * 用户被删时由 {@code AdminUserService#remove} 调用做级联 —— 库内没有任何外键，级联只能应用层显式做。
     * 本表是硬删除（deleted_at 早已移除），删了就回不来。
     */
    default void deleteByUserId(long userId) {
        var t = PaperCategoriesTable.$;
        sql().createDelete(t)
                .where(t.userId().eq(userId))
                .execute();
    }

    /** 归属校验。分类表已改为**硬删除**（deleted_at 已于 2026-09-17 移除），不再有软删除过滤。 */
    default boolean ownedBy(long categoryId, long userId) {
        var t = PaperCategoriesTable.$;
        return !sql().createQuery(t)
                .where(t.id().eq(categoryId))
                .where(t.userId().eq(userId))
                .select(t.id())
                .limit(1)
                .execute()
                .isEmpty();
    }

    /** 只取该用户的根节点；子节点由关联递归取（同一用户的树内）。 */
    default List<PaperCategoriesTree> findTree(long userId) {
        var t = PaperCategoriesTable.$;
        return sql().createQuery(t)
                .where(t.userId().eq(userId))
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

    /** 多用户改造：原来 getEntities().findAll(fetcher) 会返回**所有用户**的分类。 */
    default List<PaperCategories> findAllByUserWithFetcher(long userId, Fetcher<PaperCategories> fetcher) {
        var t = PaperCategoriesTable.$;
        return sql().createQuery(t)
                .where(t.userId().eq(userId))
                .orderBy(t.sort())
                .select(t.fetch(fetcher))
                .execute();
    }
}
