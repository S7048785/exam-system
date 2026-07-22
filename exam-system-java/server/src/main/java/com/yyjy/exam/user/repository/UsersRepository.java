package com.yyjy.exam.user.repository;

import com.yyjy.exam.entity.user.entity.Users;
import com.yyjy.exam.entity.user.entity.UsersTable;
import org.babyfish.jimmer.spring.repository.JRepository;
import org.babyfish.jimmer.sql.fetcher.Fetcher;

import java.util.Optional;

public interface UsersRepository extends JRepository<Users, Long> {
	
	Optional<Users> findByEmail(String email);

	Optional<Users> findByUuid(String uuid);
	
	default Optional<Users> findByEmail(String email, Fetcher<Users> fetcher) {
		var userT = UsersTable.$;
		return Optional.ofNullable(sql().createQuery(userT)
				                           .where(userT.email().eq(email))
				                           .select(userT.fetch(fetcher))
				                           .fetchFirstOrNull());
	}
}
