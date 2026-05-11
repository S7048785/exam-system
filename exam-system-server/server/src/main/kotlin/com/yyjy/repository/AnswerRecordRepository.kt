package com.yyjy.repository

import com.yyjy.models.entity.AnswerRecord
import com.yyjy.models.entity.examRecordId
import com.yyjy.models.entity.fetchBy
import org.babyfish.jimmer.spring.repository.KRepository
import org.babyfish.jimmer.sql.kt.ast.expression.eq

/**
 * @author Nyxcirea
 * date 2026/4/1
 * description: TODO
 */
interface AnswerRecordRepository : KRepository<AnswerRecord, Int> {
    fun findByExamId(id: Int) = sql.createQuery(AnswerRecord::class) {
        where(table.examRecordId eq id)
        select(table.fetchBy {
            allScalarFields()
            userAnswer()
        })
    }.execute()
}
