package com.yyjy.config

import cn.dev33.satoken.jwt.StpLogicJwtForStateless
import cn.dev33.satoken.stp.StpLogic
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * @author Nyxcirea
 * @date 2026/3/5
 * @description: TODO
 */
@Configuration
class SaTokenConfigure {
    // sa-token 整合 jwt (Stateless 无状态模式)
    @Bean
    fun getStpLogicJwt(): StpLogic = StpLogicJwtForStateless()
}