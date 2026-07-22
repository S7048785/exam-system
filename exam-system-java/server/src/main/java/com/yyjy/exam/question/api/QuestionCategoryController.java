package com.yyjy.exam.question.api;

import cn.dev33.satoken.annotation.SaCheckRole;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.dto.QuestionsCategoriesTree;
import com.yyjy.exam.entity.question.dto.QuestionsCategorySaveInput;
import com.yyjy.exam.entity.question.dto.QuestionsCategoryUpdateInput;
import com.yyjy.exam.entity.question.entity.QuestionsCategories;
import com.yyjy.exam.entity.question.entity.QuestionsCategoriesFetcher;
import com.yyjy.exam.question.repository.CategoriesRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.exception.SaveException;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SaCheckRole("admin")
@RestController
@RequestMapping("/question-category")
@RequiredArgsConstructor
public class QuestionCategoryController {
	
	public static final Fetcher<QuestionsCategories> CATEGORY_INFO =
			QuestionsCategoriesFetcher.$
					.name()
					.parentId()
					.sort()
					.recursiveChildren()
					.questionCount();
	private final CategoriesRepository categoriesRepository;
	
	@PostMapping("/add")
	public R<Void> addCategory(@RequestBody QuestionsCategorySaveInput category) {
		if (categoriesRepository.existsByParentIdAndName(category.getParentId(), category.getName())) {
			throw new BusinessException("分类名已存在");
		}
		categoriesRepository.save(category);
		return R.ok();
	}
	
	@PutMapping("/update")
	public R<Void> updateCategory(@RequestBody QuestionsCategoryUpdateInput category) {
		if (categoriesRepository.existsByParentIdAndName(category.getParentId(), category.getName())) {
			throw new BusinessException("分类名不能重复");
		}
		categoriesRepository.save(category, SaveMode.UPDATE_ONLY);
		return R.ok();
	}
	
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
	
	@GetMapping("/list")
	public R<List<@FetchBy("CATEGORY_INFO") QuestionsCategories>> listCategories() {
		return R.ok(categoriesRepository.findAllWithFetcher(CATEGORY_INFO));
	}
	
	@GetMapping("/tree")
	public R<List<QuestionsCategoriesTree>> tree() {
		return R.ok(categoriesRepository.findTree());
	}
}
