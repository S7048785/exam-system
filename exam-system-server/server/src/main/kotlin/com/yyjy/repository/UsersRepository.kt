package com.yyjy.repository

import com.yyjy.models.entity.Users
import com.yyjy.models.entity.email
import org.babyfish.jimmer.spring.repository.KRepository
import org.babyfish.jimmer.sql.kt.ast.expression.eq

/**
 * @author Nyxcirea
 * date 2026/4/1
 * description: TODO
 */
interface UsersRepository : KRepository<Users, Long> {

    fun findByEmail(email: String?): Users? = sql.createQuery(Users::class) {
        where(table.email eq email)
        select(table)
    }.fetchOneOrNull()
}
