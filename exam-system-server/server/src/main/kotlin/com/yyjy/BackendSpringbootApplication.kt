package com.yyjy

import com.yyjy.common.ExamProperties
import org.babyfish.jimmer.client.EnableImplicitApi
import org.babyfish.jimmer.spring.repository.EnableJimmerRepositories
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication

@EnableImplicitApi
@EnableConfigurationProperties(ExamProperties::class)
@SpringBootApplication
class ExamSystemServerApplication

fun main(args: Array<String>) {
	runApplication<ExamSystemServerApplication>(*args)
}
