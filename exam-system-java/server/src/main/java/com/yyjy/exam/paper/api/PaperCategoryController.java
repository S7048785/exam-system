package com.yyjy.exam.paper.api;

import cn.dev33.satoken.annotation.SaCheckRole;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.paper.dto.PaperCategoriesTree;
import com.yyjy.exam.entity.paper.dto.PaperCategorySaveInput;
import com.yyjy.exam.entity.paper.dto.PaperCategoryUpdateInput;
import com.yyjy.exam.entity.paper.entity.PaperCategories;
import com.yyjy.exam.entity.paper.entity.PaperCategoriesFetcher;
import com.yyjy.exam.paper.repository.PaperCategoriesRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.client.meta.Api;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.exception.SaveException;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SaCheckRole("admin")
@Api
@RestController
@RequestMapping("/paper-category")
@RequiredArgsConstructor
public class PaperCategoryController {
	
	public static final Fetcher<PaperCategories> CATEGORY_INFO =
			PaperCategoriesFetcher.$
					.name()
					.parentId()
					.sort()
					.description()
					.recursiveChildren();
	
	private final PaperCategoriesRepository paperCategoriesRepository;
	
	@Api
	@PostMapping("/add")
	public R<Void> addCategory(@RequestBody PaperCategorySaveInput category) {
		if (paperCategoriesRepository.existsByParentIdAndName(category.getParentId(), category.getName())) {
			throw new BusinessException("分类名已存在");
		}
		paperCategoriesRepository.save(category);
		return R.ok();
	}
	
	@Api
	@PutMapping("/update")
	public R<Void> updateCategory(@RequestBody PaperCategoryUpdateInput category) {
		if (paperCategoriesRepository.existsByParentIdAndName(category.getParentId(), category.getName())) {
			throw new BusinessException("分类名不能重复");
		}
		paperCategoriesRepository.save(category, SaveMode.UPDATE_ONLY);
		return R.ok();
	}
	
	@Api
	@DeleteMapping("/remove/{id}")
	public R<Void> removeCategory(@PathVariable long id) {
		if (paperCategoriesRepository.existsByParentId(id)) {
			throw new BusinessException("该分类下有子分类，不能删除");
		}
		
		if (paperCategoriesRepository.hasPapers(id)) {
			throw new BusinessException("该分类下有试卷，不能删除");
		}
		
		try {
			paperCategoriesRepository.deleteById(id);
		} catch (SaveException.CannotDissociateTarget e) {
			throw new BusinessException("删除失败");
		}
		return R.ok();
	}
	
	@Api
	@GetMapping("/list")
	public R<List<@FetchBy("CATEGORY_INFO") PaperCategories>> listCategories() {
		return R.ok(paperCategoriesRepository.findAllWithFetcher(CATEGORY_INFO));
	}
	
	@Api
	@GetMapping("/tree")
	public R<List<PaperCategoriesTree>> tree() {
		return R.ok(paperCategoriesRepository.findTree());
	}
}
