package com.yyjy.exam;

import com.yyjy.exam.common.property.CapProperties;
import com.yyjy.exam.common.property.ExcludeProperties;
import com.yyjy.exam.common.property.FrontProperties;
import com.yyjy.exam.common.property.MailProperties;
import org.babyfish.jimmer.client.EnableImplicitApi;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableImplicitApi
@SpringBootApplication
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
