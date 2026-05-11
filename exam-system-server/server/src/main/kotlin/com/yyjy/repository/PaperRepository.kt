package com.yyjy.repository

import com.yyjy.models.entity.Paper
import org.babyfish.jimmer.spring.repository.KRepository

/**
 * @author Nyxcirea
 * date 2026/4/1
 * description: TODO
 */
interface PaperRepository : KRepository<Paper, Int> {
    fun existsByName(name: String): Boolean
}
