package com.yyjy.exam.question.api;

import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.dto.CategoriesTree;
import com.yyjy.exam.entity.question.dto.CategorySaveInput;
import com.yyjy.exam.entity.question.dto.CategoryUpdateInput;
import com.yyjy.exam.entity.question.entity.Categories;
import com.yyjy.exam.entity.question.entity.CategoriesTable;
import com.yyjy.exam.entity.question.entity.QuestionsTable;
import com.yyjy.exam.question.repository.CategoriesRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.meta.Api;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.exception.SaveException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Api
@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
public class CategoryController {
	
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
	public R<Void> removeCategory(@PathVariable Long id) {
		if (categoriesRepository.existsByParentId(id)) {
			throw new BusinessException("该分类下有子分类，不能删除");
		}
		
		QuestionsTable qt = QuestionsTable.$;
		boolean hasQuestions = categoriesRepository.sql().createQuery(qt)
				                       .where(qt.categoryId().eq(id))
				                       .select(qt)
				                       .limit(1)
				                       .fetchFirstOrNull() != null;
		if (hasQuestions) {
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
	public R<Void> getCategory(@PathVariable Long id) {
		return R.ok();
	}
	
	@Api
	@GetMapping("/list")
	public R<List<Categories>> listCategories() {
		CategoriesTable t = CategoriesTable.$;
		List<Categories> categories = categoriesRepository.sql().createQuery(t)
				                              .select(t)
				                              .execute();
		return R.ok(categories);
	}
	
	@Api
	@GetMapping("/tree")
	public R<List<CategoriesTree>> tree() {
		return R.ok(categoriesRepository.findTree());
	}
}
