package com.yyjy.exam.user.service;

import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.user.dto.UserPageView;
import com.yyjy.exam.entity.user.dto.UserSaveInput;
import com.yyjy.exam.entity.user.dto.UserUpdateInput;
import com.yyjy.exam.entity.user.entity.UsersDraft;
import com.yyjy.exam.entity.user.entity.UsersTable;
import com.yyjy.exam.paper.repository.PaperCategoriesRepository;
import com.yyjy.exam.question.repository.CategoriesRepository;
import com.yyjy.exam.user.repository.UsersRepository;
import org.apache.commons.lang3.StringUtils;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.Predicate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminUserService {
	
	private final UsersRepository usersRepository;
	private final JSqlClient sqlClient;
	private final CategoriesRepository questionCategoriesRepository;
	private final PaperCategoriesRepository paperCategoriesRepository;
	
	public AdminUserService(UsersRepository usersRepository, JSqlClient sqlClient,
	                        CategoriesRepository questionCategoriesRepository,
	                        PaperCategoriesRepository paperCategoriesRepository) {
		this.usersRepository = usersRepository;
		this.sqlClient = sqlClient;
		this.questionCategoriesRepository = questionCategoriesRepository;
		this.paperCategoriesRepository = paperCategoriesRepository;
	}
	
	/**
	 * 查询用户列表，支持 keyword 模糊搜索 email/realName，分页
	 */
	public List<UserPageView> list(String keyword, int page, int size) {
		UsersTable t = UsersTable.$;
		var query = sqlClient.createQuery(t);
		
		if (keyword != null && !keyword.isBlank()) {
			query = query.where(
					Predicate.or(t.email().like("%" + keyword + "%"), t.realName().like("%" + keyword + "%"))
			);
		}
		
		return query
				       .orderBy(t.createTime().desc())
				       .select(t.fetch(UserPageView.class))
				       .limit(size, (long) (page - 1) * size)
				       .execute();
	}
	
	/**
	 * 新增用户
	 */
	@Transactional
	public void save(UserSaveInput input) {
		if (usersRepository.findByEmail(input.getEmail()).isPresent()) {
			throw new BusinessException("邮箱号已存在");
		}
		
		String hashedPassword = new BCryptPasswordEncoder().encode(input.getPassword());
		
		usersRepository.save(UsersDraft.$.produce(draft -> {
			draft.setEmail(input.getEmail());
			draft.setRealName(input.getRealName());
			draft.setPassword(hashedPassword);
			draft.setRole(input.getRole());
			draft.setStatus(input.getStatus());
		}));
		// 不建试题根分类：由查询接口兜底懒建（QuestionCategoryService#ensureRootCategory）
	}
	
	/**
	 * 更新用户，密码为空时不修改密码
	 */
	@Transactional
	public void update(UserUpdateInput input) {
		var existing = usersRepository.findById(input.getId())
				               .orElseThrow(() -> new BusinessException("用户不存在"));
		
		usersRepository.save(UsersDraft.$.produce(draft -> {
			draft.setId(input.getId());
			draft.setEmail(input.getEmail() != null ? input.getEmail() : existing.email());
			draft.setRealName(input.getRealName() != null ? input.getRealName() : existing.realName());
			
			if (!StringUtils.isEmpty(input.getPassword())) {
				draft.setPassword(new BCryptPasswordEncoder().encode(input.getPassword()));
			}
			draft.setRole(input.getRole() != null ? input.getRole() : existing.role());
			draft.setStatus(input.getStatus() != null ? input.getStatus() : existing.status());
		}));
	}
	
	/**
	 * 删除用户，并级联清掉该用户的两棵分类树（试题分类 + 试卷分类）。
	 * <p>
	 * 🔴 删除语义：users 和两张分类表**现在都是硬删**——分类表的 deleted_at 早已移除，
	 * 而 {@code Users.delFlag} 上的 {@code @LogicalDeleted} 目前是被注释掉的状态（见实体）。
	 * 所以删了就回不来，且 users.email 会真正释放（普通唯一索引不含 deleted_at）。
	 * ⚠️ 若哪天把 Users 上的 {@code @LogicalDeleted} 恢复，users 会变回软删而分类仍是硬删，两者就不一致了。
	 * <p>
	 * 🔴 库内没有任何外键，级联只能应用层显式做，所以这里必须手写。
	 * <p>
	 * ⚠️ 只清分类，**不动**该用户遗留的题目 / 试卷 / 考试记录：那些表的 category_id 会变成指向
	 * 已删分类的悬空值（前端取分类名会拿到空）。要一起清得另说。
	 */
	@Transactional
	public void remove(Long id) {
		if (usersRepository.findById(id).isEmpty()) {
			throw new BusinessException("用户不存在");
		}
		// 先清子树再删主表。没有外键约束，顺序其实无所谓，但按「先子后父」更符合直觉。
		questionCategoriesRepository.deleteByUserId(id);
		paperCategoriesRepository.deleteByUserId(id);
		usersRepository.deleteById(id);
	}
	
	/**
	 * 获取用户详情
	 */
	public UserPageView getById(Long id) {
		UsersTable t = UsersTable.$;
		return sqlClient.createQuery(t)
				       .where(t.id().eq(id))
				       .select(t.fetch(UserPageView.class))
				       .fetchFirstOrNull();
	}
}
