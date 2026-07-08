package com.yyjy.exam.common.auth;

import cn.dev33.satoken.stp.StpInterface;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.yyjy.exam.entity.user.entity.UsersTable;
import com.yyjy.exam.user.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class StpInterfaceImpl implements StpInterface {
	@Autowired
	private UsersRepository userRepository;
	@Autowired
	private StringRedisTemplate redisTemplate;
	
	/**
	 * 获取用户权限列表
	 *
	 * @param loginId   用户ID
	 * @param loginType 登录类型
	 * @return 权限列表
	 */
	@Override
	public List<String> getPermissionList(Object loginId, String loginType) {
		// 实现权限加载逻辑
		return Collections.emptyList();
	}
	
	/**
	 * 获取用户角色列表（带Redis缓存）
	 *
	 * @param loginId   用户ID
	 * @param loginType 登录类型
	 * @return 角色列表
	 */
	@Override
	public List<String> getRoleList(Object loginId, String loginType) {
		// 1. 尝试从Redis获取缓存
		String roleList = redisTemplate.opsForValue().get("role:" + loginId);
		if (StrUtil.isNotEmpty(roleList)) {
			return JSONUtil.toList(roleList, String.class);
		}
		
		// 1. 利用 String.valueOf() 安全获取字符串，避免强转异常
		String loginIdStr = String.valueOf(loginId);
		
		// 2. 如果需要 Long 类型去查数据库，再手动解析
		Long userId = Long.parseLong(loginIdStr);
		// 2. 从数据库查询角色信息
		List<String> roles = userRepository.sql().createQuery(UsersTable.$)
				                     .where(UsersTable.$.id().eq(userId))
				                     .select(UsersTable.$.role())
				                     .execute();
		
		// 3. 存入Redis缓存
		redisTemplate.opsForValue().set("role:" + loginId, JSONUtil.toJsonStr(roles));
		
		return roles;
	}
}