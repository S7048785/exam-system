package com.yyjy.exam.user.service;

import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.user.dto.UserPageView;
import com.yyjy.exam.entity.user.dto.UserSaveInput;
import com.yyjy.exam.entity.user.dto.UserUpdateInput;
import com.yyjy.exam.entity.user.entity.UsersDraft;
import com.yyjy.exam.entity.user.entity.UsersTable;
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
	
	public AdminUserService(UsersRepository usersRepository, JSqlClient sqlClient) {
		this.usersRepository = usersRepository;
		this.sqlClient = sqlClient;
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
	 * 软删除用户
	 */
	@Transactional
	public void remove(Long id) {
		if (usersRepository.findById(id).isEmpty()) {
			throw new BusinessException("用户不存在");
		}
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
