package com.yyjy.exam.question.service;

import com.yyjy.exam.entity.question.entity.QuestionsCategoriesDraft;
import com.yyjy.exam.question.repository.CategoriesRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.stereotype.Service;

/**
 * 试题分类的服务端自维护逻辑。
 * <p>
 * 分类的增删改查仍在 {@code QuestionCategoryController}（每个方法各自做归属校验），
 * 这里只放「不该由客户端触发」的动作。
 */
@Service
@RequiredArgsConstructor
public class QuestionCategoryService {
	
	/**
	 * 新用户的默认试题根分类名。对应 DB 里 {@code parent_id = 0 且 sort = 0} 的那一条。
	 */
	private static final String ROOT_CATEGORY_NAME = "试题分类";
	
	private final CategoriesRepository categoriesRepository;
	
	/**
	 * 该用户**一条分类都没有**时，补一个默认根分类「试题分类」（{@code parent_id = 0}、{@code sort = 0}）。
	 *
	 * @param userId 用户 id
	 */
	public void ensureRootCategory(long userId) {
		if (categoriesRepository.existsByUserId(userId)) {
			return;
		}
		categoriesRepository.save(
				QuestionsCategoriesDraft.$.produce(draft -> {
					draft.setName(ROOT_CATEGORY_NAME);
					draft.setParentId(0L);
					draft.setUserId(userId);
					draft.setSort(0);
				}),
				SaveMode.INSERT_ONLY);
	}
}
