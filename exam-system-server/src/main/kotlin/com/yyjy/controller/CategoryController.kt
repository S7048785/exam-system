package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.entity.Categories
import com.yyjy.models.entity.by
import com.yyjy.models.entity.dto.CategoriesTree
import com.yyjy.models.entity.dto.CategorySaveInput
import com.yyjy.models.entity.dto.CategoryUpdateInput
import com.yyjy.models.entity.id
import com.yyjy.models.entity.questions
import com.yyjy.repository.CategoriesRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.babyfish.jimmer.client.meta.Api
import org.babyfish.jimmer.sql.ast.mutation.SaveMode
import org.babyfish.jimmer.sql.exception.SaveException
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.babyfish.jimmer.sql.kt.fetcher.newFetcher
import org.springframework.web.bind.annotation.*

@Api
@Tag(name = "分类模块")
@RequestMapping("/category")
@RestController
class CategoryController(
    private val categoriesRepository: CategoriesRepository
) {

    @Api
    @Operation(summary = "新增分类")
    @PostMapping("/add")
    fun addCategory(@RequestBody category: CategorySaveInput): R<String?> {
        // 查询分类名是否重复
        val exists = categoriesRepository.existsByParentIdAndName(category.parentId, category.name)
        if (exists) {
            return R.fail("分类名已存在")
        }

        categoriesRepository.save(category)
        return R.ok()
    }

    @Api
    @Operation(summary = "更新分类")
    @PutMapping("/update")
    fun updateCategory(@RequestBody category: CategoryUpdateInput): R<String?> {
        val exists = categoriesRepository.existsByParentIdAndName(category.parentId, category.name)
        if (exists) {
            return R.fail("分类名不能重复")
        }
        categoriesRepository.save(category, SaveMode.UPDATE_ONLY)
        return R.ok()
    }

    @Api
    @Operation(summary = "删除分类")
    @DeleteMapping("/remove/{id}")
    fun removeCategory(@PathVariable id: Long): R<String?> {
        // 查询是否存在子分类
        val hasChildren = categoriesRepository.existsByParentId(id)
        if (hasChildren) {
            return R.fail("该分类下有子分类，不能删除")
        }
        // 该分类是否有题目
        val exists = categoriesRepository.sql.createQuery(Categories::class) {
            where(table.id eq id)
            select(table.asTableEx().questions.id)
        }.exists()
        if (exists) {
            return R.fail("该分类下有题目，不能删除")
        }
        try {
            categoriesRepository.deleteById(id)
        } catch (e: SaveException.CannotDissociateTarget) {
            return R.fail("删除失败")
        }
        return R.ok()
    }

    @Api
    @Operation(summary = "获取分类")
    @GetMapping("/{id}")
    fun getCategory(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Api
    @Operation(summary = "分类列表")
    @GetMapping("/list")
    fun listCategories(): R<List<Categories>> {
        val categories = categoriesRepository.sql.findAll(CATEGORIES_ITEM)
        return R.ok(categories)
    }

    @Api
    @Operation(summary = "获取分类树")
    @GetMapping("/tree")
    fun tree(): R<List<CategoriesTree>> {
        val categories = categoriesRepository.findTree()
        return R.ok(categories)
    }

    companion object {
        val CATEGORIES_ITEM = newFetcher(Categories::class).by {
            name()
            parentId()
            sort()
            children()
            questionCount()
        }
    }
}
