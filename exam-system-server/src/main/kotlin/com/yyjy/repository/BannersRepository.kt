package com.yyjy.repository

import com.yyjy.models.entity.Banners
import com.yyjy.models.entity.active
import org.babyfish.jimmer.spring.repository.KRepository
import org.babyfish.jimmer.sql.fetcher.Fetcher
import org.babyfish.jimmer.sql.kt.ast.expression.eq

/**
 * @author Nyxcirea
 * date 2026/4/1
 * description: TODO
 */
interface BannersRepository : KRepository<Banners, Long> {
    fun findBannersByActive(fetcher: Fetcher<Banners>, active: Boolean): List<Banners> = sql.createQuery(Banners::class) {
        where(table.active eq active)
        select(table.fetch(fetcher))
    }.execute()

}