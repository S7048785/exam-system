package com.yyjy.exam.question.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.dto.QuestionsCategoriesTree;
import com.yyjy.exam.entity.question.dto.QuestionsCategorySaveInput;
import com.yyjy.exam.entity.question.dto.QuestionsCategoryUpdateInput;
import com.yyjy.exam.entity.question.entity.QuestionsCategories;
import com.yyjy.exam.entity.question.entity.QuestionsCategoriesDraft;
import com.yyjy.exam.entity.question.entity.QuestionsCategoriesFetcher;
import com.yyjy.exam.question.repository.CategoriesRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.exception.SaveException;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 试题分类。多用户改造后：每个用户只看 / 只改自己的分类。
 * 原为类级 @SaCheckRole("admin")，已改为 @SaCheckLogin —— 所以下面每个方法都必须自己做归属校验。
 */
@SaCheckLogin
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
		long me = StpUtil.getLoginIdAsLong();
		requireOwnedParentIfPresent(category.getParentId(), me);
		if (categoriesRepository.existsByUserIdAndParentIdAndName(me, category.getParentId(), category.getName())) {
			throw new BusinessException("分类名已存在");
		}
		// owner 由服务端注入（DTO 里没有该字段，客户端无法伪造）。
		// 显式 INSERT_ONLY：避免实体上的 @Key(name) 在没有 id 时按业务键查行、把别人的分类改掉。
		categoriesRepository.save(
				QuestionsCategoriesDraft.$.produce(category.toEntity(), d -> d.setUserId(me)),
				SaveMode.INSERT_ONLY);
		return R.ok();
	}
	
	@PutMapping("/update")
	public R<Void> updateCategory(@RequestBody QuestionsCategoryUpdateInput category) {
		long me = StpUtil.getLoginIdAsLong();
		requireOwnedCategory(category.getId(), me);
		requireOwnedParentIfPresent(category.getParentId(), me);
		// 排除自身，否则"不改名只改排序"会被自己拦住
		if (categoriesRepository.existsByUserIdAndParentIdAndNameExcludingId(
				me, category.getParentId(), category.getName(), category.getId())) {
			throw new BusinessException("分类名不能重复");
		}
		// 更新不碰 owner，所以仍然直接存 Input
		categoriesRepository.save(category, SaveMode.UPDATE_ONLY);
		return R.ok();
	}
	
	@DeleteMapping("/remove/{id}")
	public R<Void> removeCategory(@PathVariable long id) {
		requireOwnedCategory(id, StpUtil.getLoginIdAsLong());
		
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
		return R.ok(categoriesRepository.findAllByUserWithFetcher(StpUtil.getLoginIdAsLong(), CATEGORY_INFO));
	}
	
	@GetMapping("/tree")
	public R<List<QuestionsCategoriesTree>> tree() {
		return R.ok(categoriesRepository.findTree(StpUtil.getLoginIdAsLong()));
	}
	
	/** 多用户改造：写操作前必须确认这条分类是自己的。Jimmer 会自动过滤软删除行。 */
	private void requireOwnedCategory(Long id, long me) {
		if (id == null || !categoriesRepository.ownedBy(id, me)) {
			throw new BusinessException("分类不存在");
		}
	}
	
	/** 多用户改造：不能把分类挂到别人的分类下。parentId = 0 表示根节点，无需校验。 */
	private void requireOwnedParentIfPresent(long parentId, long me) {
		if (parentId != 0L && !categoriesRepository.ownedBy(parentId, me)) {
			throw new BusinessException("父分类不存在");
		}
	}
}
