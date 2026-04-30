package com.yyjy.service

import com.yyjy.models.entity.Users
import com.yyjy.repository.UsersRepository
import com.yyjy.utils.JwtUtil
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class UserService(
    private val usersRepository: UsersRepository,
    private val jwtUtil: JwtUtil
) {
    fun login(username: String, password: String): String {
        val userDb = usersRepository.findByUsername(username)
        val encoder = BCryptPasswordEncoder()

        if (userDb == null || !encoder.matches(password, userDb.password)) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "用户名或密码错误")
        }
        val token = jwtUtil.createJwt(userDb.id.toString())
        return token
    }

    fun registerUser(username: String, realName: String?, password: String) {
        val userDb = usersRepository.findByUsername(username)
        if (userDb != null) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "用户名已存在")
        }
        val encoder = BCryptPasswordEncoder()

        val hashedPassword = encoder.encode(password)
        usersRepository.save(Users {
            this.username = username
            this.realName = realName
            this.password = hashedPassword!!
        })
    }
}
