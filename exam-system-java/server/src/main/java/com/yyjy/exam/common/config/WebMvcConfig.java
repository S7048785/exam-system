package com.yyjy.exam.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.property.ExcludeProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.util.ArrayList;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
	
	private final ExcludeProperties excludeProperties;
	
	public WebMvcConfig(ExcludeProperties excludeProperties) {
		this.excludeProperties = excludeProperties;
	}
	
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		ArrayList<String> excludePaths = new ArrayList<>(excludeProperties.path());
		excludePaths.add("/");
		excludePaths.add("/error");
		excludePaths.add("/favicon.ico");
		excludePaths.add("/openapi.yml");
		excludePaths.add("/openapi.html");
		
		registry.addInterceptor(new SaInterceptor(handle -> StpUtil.checkLogin()))
				.addPathPatterns("/**")
				.excludePathPatterns(excludePaths);
	}
	
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		String userDir = System.getProperty("user.dir");
		
		registry.addResourceHandler("/systemPictures/**")
				.addResourceLocations("file:" + userDir + File.separator + "uploadFile" + File.separator + "systemPictures" + File.separator);
		registry.addResourceHandler("/uploadFile/pluginFiles/logo/**")
				.addResourceLocations("file:" + userDir + File.separator + "uploadFile" + File.separator + "pluginFiles" + File.separator + "logo" + File.separator);
	}
}
