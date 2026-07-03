package com.yyjy.repository

import com.yyjy.models.entity.Categories
import com.yyjy.models.entity.dto.CategoriesTree
import com.yyjy.models.entity.parentId
import com.yyjy.models.entity.sort
import org.babyfish.jimmer.spring.repository.KRepository
import org.babyfish.jimmer.sql.kt.ast.expression.eq

/**
 * @author Nyxcirea
 * date 2026/4/1
 * description: TODO
 */
interface CategoriesRepository : KRepository<Categories, Long> {
    fun findTree(): List<CategoriesTree> {
        val items = sql.createQuery(Categories::class) {
            where(table.parentId eq 0)
            orderBy(table.sort)
            select(table.fetch(CategoriesTree::class))
        }.execute()
        calculateCount(items)

        return items
    }

    fun calculateCount(categories: List<CategoriesTree>): Int {
        var total = 0
        for (node in categories) {
            if (node.children!!.isEmpty()) {
                // 如果是叶子节点，保持它原有的 count (或者根据业务逻辑处理)
                total += node.questionCount
            } else {
                // 如果有子节点，递归计算子节点的总和
                val childrenSum = node.children?.let { calculateCount(it) }
                if (childrenSum != null) {
                    node.questionCount = childrenSum
                    // 将汇总值赋给父节点
                    total += childrenSum
                }
            }
        }
        return total
    }

    fun existsByParentIdAndName(parentId: Long, name: String): Boolean
    fun existsByParentId(parentId: Long): Boolean
}
