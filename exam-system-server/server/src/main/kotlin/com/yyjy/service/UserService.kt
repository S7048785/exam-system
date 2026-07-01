package com.yyjy.service

import com.yyjy.models.entity.Users
import com.yyjy.repository.UsersRepository
import com.yyjy.utils.JwtUtil
import org.babyfish.jimmer.sql.fetcher.Fetcher
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class UserService(
    private val usersRepository: UsersRepository,
    private val jwtUtil: JwtUtil
) {
    fun login(email: String, password: String): String {
        val userDb = usersRepository.findByEmail(email)
        val encoder = BCryptPasswordEncoder()

        if (userDb == null || !encoder.matches(password, userDb.password)) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "用户名或密码错误")
        }
        val token = jwtUtil.createJwt(userDb.id.toString())
        return token
    }

    fun registerUser(email: String, realName: String, password: String) {
        val userDb = usersRepository.findByEmail(email)
        if (userDb != null) {
            throw ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "邮箱号已存在")
        }
        val encoder = BCryptPasswordEncoder()

        val hashedPassword = encoder.encode(password)
        usersRepository.save(Users {
            this.email = email
            this.realName = realName
            this.password = hashedPassword!!
        })
    }

    fun getUserInfo(token: String, fetcher: Fetcher<Users>): Users? {
        val userId: Long?
        try {
            userId = jwtUtil.parseJwt(token).toLong()
        } catch (e: ResponseStatusException) {
            return null
        }
        val userDb = usersRepository.findById(userId, fetcher).orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户不存在") }
        return userDb
    }
}
