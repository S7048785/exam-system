plugins {
	kotlin("jvm") version "2.1.0"
	kotlin("plugin.spring") version "2.1.0"
	id("org.springframework.boot") version "3.4.5"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.google.devtools.ksp") version "2.1.0-1.0.29"
}

val jimmerVersion = "0.10.6"
group = "com.yyjy"
version = "0.0.1-SNAPSHOT"
description = "exam-system-server"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

configurations {
	compileOnly {
		extendsFrom(configurations.annotationProcessor.get())
	}
}

repositories {
	mavenCentral()
}

dependencies {
	// 百炼大模型
	implementation("com.alibaba.cloud.ai:spring-ai-alibaba-starter-dashscope:1.1.2.0")
	// Spring AI Alibaba Agent Framework
	implementation("com.alibaba.cloud.ai:spring-ai-alibaba-agent-framework:1.1.2.0")
	// EasyExcel
	implementation("com.alibaba:easyexcel:3.1.0")
	// hutool json
	implementation("cn.hutool:hutool-json:5.8.42")
	// Aop 切面
	implementation("org.springframework.boot:spring-boot-starter-aop")
	// Apache Tika 处理文件类型检测
	implementation("org.apache.tika:tika-core:2.9.1")
	// minio
	implementation("io.minio:minio:8.4.3")
	// 连接池
	implementation("org.apache.commons:commons-pool2")
	// redis
	implementation("org.springframework.boot:spring-boot-starter-data-redis")
	// Sa-Token 整合 jwt
	implementation("cn.dev33:sa-token-jwt:1.44.0")
	// sa-token
	implementation("cn.dev33:sa-token-spring-boot3-starter:1.44.0")
	// kotlin-logging日志打印
	implementation("io.github.oshai:kotlin-logging-jvm:6.0.3")
	// jimmer
	implementation("org.babyfish.jimmer:jimmer-spring-boot-starter:${jimmerVersion}")
//	"developmentOnly"("org.springframework.boot:spring-boot-devtools")
	ksp("org.babyfish.jimmer:jimmer-ksp:${jimmerVersion}")
	// knife4j
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9")
	implementation("com.github.xiaoymin:knife4j-openapi3-jakarta-spring-boot-starter:4.5.0")
	// jwt
	implementation("com.auth0:java-jwt:4.4.0")
	// spring-web
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
	implementation("org.jetbrains.kotlin:kotlin-reflect")
	// spring-test
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
	testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
	// mysql
	runtimeOnly("com.mysql:mysql-connector-j")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}

kotlin {
	sourceSets.main {
		kotlin.srcDir("build/generated/ksp/main/kotlin")
	}
	compilerOptions {
		freeCompilerArgs.addAll(
			"-Xjsr305=strict",
			"-Xskip-metadata-version-check",
			"-Xbackend-threads=0" // 自动使用CPU核心，编译最快
		)
	}
}
tasks.withType<Test> {
	useJUnitPlatform()
}

ksp {
	arg("jimmer.dto.mutable", "true")
}