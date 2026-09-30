package com.yyjy.exam.paper.service;

import com.yyjy.exam.entity.paper.entity.PaperCategoriesDraft;
import com.yyjy.exam.paper.repository.PaperCategoriesRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.stereotype.Service;

/**
 * 试卷分类的服务端自维护逻辑。
 * <p>
 * 分类的增删改查仍在 {@code PaperCategoryController}（每个方法各自做归属校验），
 * 这里只放「不该由客户端触发」的动作。与试题分类的 {@code QuestionCategoryService} 一一对应。
 */
@Service
@RequiredArgsConstructor
public class PaperCategoryService {
	
	/** 默认根分类名。对应 DB 里 {@code parent_id = 0 且 sort = 0} 的那一条。 */
	private static final String ROOT_CATEGORY_NAME = "试卷分类";
	
	private final PaperCategoriesRepository paperCategoriesRepository;
	
	/**
	 * 该用户**一条分类都没有**时，补一个默认根分类「试卷分类」（{@code parent_id = 0}、{@code sort = 0}）。
	 * <p>
	 * 调用点在查询接口里（见 {@code PaperCategoryController#tree} 与 {@code #list}），返回前兜一次。
	 * 理由同试题分类：老账号、后台建号、直接改库造出来的用户，挂在建用户流程上必漏。
	 * <p>
	 * ⚠️ 这个方法必须和「禁止手工加根」配套存在：试卷分类一旦禁掉手工加根，
	 * 新用户没有别的途径造出第一个根分类，也就没有父节点可挂子分类 —— 直接卡死。
	 * <p>
	 * 判据是「该用户没有任何分类」而不是「没有叫试卷分类的分类」——用户自建过别的分类就不插手。
	 * <p>
	 * 显式 {@link SaveMode#INSERT_ONLY}：实体上同时有 {@code @Key(name)} 和 {@code @Key(user)}，
	 * 默认的 UPSERT 会先按业务键查行 —— 一旦命中就变成「改掉别人同名分类」，
	 * 与 {@code PaperCategoryController#addCategory} 是同款坑。
	 * <p>
	 * ⚠️ 判空 + 插入不是原子的：并发首次查询理论上会双双插入，第二次撞
	 * {@code uk_paper_cat_user_parent_name} 报 500。实际很难触发，真触发也自愈。
	 *
	 * @param userId 用户 id
	 */
	public void ensureRootCategory(long userId) {
		if (paperCategoriesRepository.existsByUserId(userId)) {
			return;
		}
		paperCategoriesRepository.save(
				PaperCategoriesDraft.$.produce(draft -> {
					draft.setName(ROOT_CATEGORY_NAME);
					draft.setParentId(0L);
					draft.setUserId(userId);
					draft.setSort(0);
				}),
				SaveMode.INSERT_ONLY);
	}
}
