package com.yyjy.exam;

import com.yyjy.exam.common.property.CapProperties;
import com.yyjy.exam.common.property.ExcludeProperties;
import com.yyjy.exam.common.property.FrontProperties;
import com.yyjy.exam.common.property.MailProperties;
import org.babyfish.jimmer.client.EnableImplicitApi;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableImplicitApi
@SpringBootApplication
// 超时自动交卷靠 @Scheduled，没有这个注解定时任务不会启动
@EnableScheduling
// 注册验证邮件由 UserRegisteredEmailListener 用 @Async 异步发送，没有这个注解事件会退化成同步执行
@EnableAsync
@EnableConfigurationProperties({
		FrontProperties.class,
		ExcludeProperties.class,
		CapProperties.class,
		MailProperties.class
})
public class ExamSystemJavaApplication {
	
	public static void main(String[] args) {
		SpringApplication.run(ExamSystemJavaApplication.class, args);
	}
}
