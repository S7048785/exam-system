package com.yyjy.config

import com.yyjy.common.ExamProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

/**
 * @author Nyxcirea
 * @date 2026/2/13
 * @description: TODO
 */
@Configuration
class GlobalCorsConfig(
    private val examProperties: ExamProperties,
) {

    @Bean
    fun corsConfigurer(): WebMvcConfigurer {
        return object: WebMvcConfigurer {
            override fun addCorsMappings(regisitry: CorsRegistry) {
                regisitry.addMapping("/**")
                    .allowedOrigins(*examProperties.front.ip.toTypedArray())
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
            }
        }
    }
}