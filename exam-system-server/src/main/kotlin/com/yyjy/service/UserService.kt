package com.yyjy.service

import com.yyjy.repository.UsersRepository
import org.springframework.stereotype.Service

@Service
class UserService(
    private val usersRepository: UsersRepository
)
