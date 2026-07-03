package com.yyjy.exam.question.api;

import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.dto.CategoriesTree;
import com.yyjy.exam.entity.question.dto.CategorySaveInput;
import com.yyjy.exam.entity.question.dto.CategoryUpdateInput;
import com.yyjy.exam.entity.question.entity.Categories;
import com.yyjy.exam.entity.question.entity.CategoriesFetcher;
import com.yyjy.exam.question.repository.CategoriesRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.client.meta.Api;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.exception.SaveException;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Api
@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
public class CategoryController {
	
	public static final Fetcher<Categories> CATEGORY_INFO =
			CategoriesFetcher.$
					.name()
					.parentId()
					.sort()
					.recursiveChildren()
					.questionCount();
	private final CategoriesRepository categoriesRepository;
	
	@Api
	@PostMapping("/add")
	public R<Void> addCategory(@RequestBody CategorySaveInput category) {
		if (categoriesRepository.existsByParentIdAndName(category.getParentId(), category.getName())) {
			throw new BusinessException("分类名已存在");
		}
		categoriesRepository.save(category);
		return R.ok();
	}
	
	@Api
	@PutMapping("/update")
	public R<Void> updateCategory(@RequestBody CategoryUpdateInput category) {
		if (categoriesRepository.existsByParentIdAndName(category.getParentId(), category.getName())) {
			throw new BusinessException("分类名不能重复");
		}
		categoriesRepository.save(category, SaveMode.UPDATE_ONLY);
		return R.ok();
	}
	
	@Api
	@DeleteMapping("/remove/{id}")
	public R<Void> removeCategory(@PathVariable long id) {
		if (categoriesRepository.existsByParentId(id)) {
			throw new BusinessException("该分类下有子分类，不能删除");
		}
		
		if (categoriesRepository.hasQuestions(id)) {
			throw new BusinessException("该分类下有题目，不能删除");
		}
		
		try {
			categoriesRepository.deleteById(id);
		} catch (SaveException.CannotDissociateTarget e) {
			throw new BusinessException("删除失败");
		}
		return R.ok();
	}
	
	@Api
	@GetMapping("/{id}")
	public R<Void> getCategory(@PathVariable long id) {
		return R.ok();
	}
	
	@Api
	@GetMapping("/list")
	public R<List<@FetchBy("CATEGORY_INFO") Categories>> listCategories() {
		return R.ok(categoriesRepository.findAllWithFetcher(CATEGORY_INFO));
	}
	
	@Api
	@GetMapping("/tree")
	public R<List<CategoriesTree>> tree() {
		return R.ok(categoriesRepository.findTree());
	}
}
