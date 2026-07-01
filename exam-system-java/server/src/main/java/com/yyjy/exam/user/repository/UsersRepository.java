package com.yyjy.exam.user.repository;

import com.yyjy.exam.entity.user.entity.Users;
import org.babyfish.jimmer.spring.repository.JRepository;

import java.util.Optional;

public interface UsersRepository extends JRepository<Users, Long> {

    Optional<Users> findByEmail(String email);
}
