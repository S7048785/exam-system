package com.yyjy.repository

import com.yyjy.models.entity.Questions
import com.yyjy.models.entity.dto.QuestionsPageView
import com.yyjy.models.entity.id
import com.yyjy.models.entity.title
import org.babyfish.jimmer.spring.repository.KRepository
import org.babyfish.jimmer.sql.kt.ast.expression.desc
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.babyfish.jimmer.sql.kt.ast.expression.valueIn
import org.babyfish.jimmer.sql.kt.ast.expression.valueNotIn

/**
 * @author Nyxcirea
 * date 2026/4/1
 * description: TODO
 */
interface QuestionsRepository : KRepository<Questions, Long> {
    fun existsByCategoryIdAndTitle(categoryId: Long, title: String): Boolean
    fun existsByTypeAndTitle(type: String, title: String): Boolean
    fun getLast(size: Int): List<QuestionsPageView> {
        return sql.createQuery(Questions::class) {
            orderBy(table.id.desc())
            select(table.fetch(QuestionsPageView::class))
        }.limit(size).execute()
    }

    fun getLastNotIn(size: Int, popularIds: List<Long>): List<QuestionsPageView> {
        return sql.createQuery(Questions::class) {
            where(table.id valueNotIn popularIds)
            select(table.fetch(QuestionsPageView::class))
        }.limit(size).execute()
    }
    fun findQuestionsPageViewById(id: Long): QuestionsPageView? {
        return sql.createQuery(Questions::class) {
            where(table.id eq id)
            select(table.fetch(QuestionsPageView::class))
        }.fetchFirstOrNull()
    }

    fun findAllIds(): List<Long> {
        return sql.createQuery(Questions::class) {
            select(table.id)
        }.execute()
    }

    fun titleIsRepeat(map: List<String>) {
        sql.createQuery(Questions::class) {
            where(table.title valueIn map)
            select(table.title)
        }.execute()
    }
}
