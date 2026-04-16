package com.yyjy.config

import cn.dev33.satoken.interceptor.SaInterceptor
import com.yyjy.common.ExamProperties
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.io.File

@Configuration
class WebMvcConfig(
    private val examProperties: ExamProperties,
) : WebMvcConfigurer {

    /**
     * 配置拦截器
     */
    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(SaInterceptor()) // 拦截所有路径
            .addPathPatterns("/**")
            .excludePathPatterns(
                examProperties.exclude.path
            )
            .excludePathPatterns( // Swagger相关路径
                "/doc.html",
                "/webjars/**",
                "/swagger-resources/**",
                "/v3/**",
                "/favicon.ico"
            )
    }

    /**
     * 配置视图控制器
     */
    override fun addViewControllers(registry: ViewControllerRegistry) {
        // 访问 / 时，重定向到 /doc.html
        registry.addRedirectViewController("/", "/doc.html")
    }

    /**
     * 配置资源处理器
     */
    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        registry.addResourceHandler("/systemPictures/**")
            .addResourceLocations("file:" + System.getProperty("user.dir") + File.separator + "uploadFile" + File.separator + "systemPictures" + File.separator)
        registry.addResourceHandler("/uploadFile/pluginFiles/logo/**")
            .addResourceLocations("file:" + System.getProperty("user.dir") + File.separator + "uploadFile" + File.separator + "pluginFiles" + File.separator + "logo" + File.separator)

        registry.addResourceHandler("doc.html").addResourceLocations("classpath:/META-INF/resources/")
        registry.addResourceHandler("/webjars/**").addResourceLocations("classpath:/META-INF/resources/webjars/")
    }
}