plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("org.springframework.boot")
    kotlin("plugin.serialization")
}

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

group = "com.yyjy"
version = "0.0.1-SNAPSHOT"
description = "server"

val jimmerVersion: String by rootProject.extra
val springBootVersion: String by rootProject.extra

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:${springBootVersion}"))
    testImplementation(platform("org.springframework.boot:spring-boot-dependencies:${springBootVersion}"))

    implementation(project(":entity"))

    implementation("cn.hutool:hutool-crypto:5.8.42")
    implementation("org.springframework.security:spring-security-crypto:7.0.0")

    implementation("io.ktor:ktor-client-core:2.3.7")
    implementation("io.ktor:ktor-client-cio:2.3.7")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.7")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")

    implementation("com.alibaba.cloud.ai:spring-ai-alibaba-starter-dashscope:1.1.2.0")
    implementation("com.alibaba.cloud.ai:spring-ai-alibaba-agent-framework:1.1.2.0")

    implementation("com.alibaba:easyexcel:3.1.0")
    implementation("cn.hutool:hutool-json:5.8.42")

    implementation("org.springframework.boot:spring-boot-starter-aop")
    implementation("org.apache.tika:tika-core:2.9.1")
    implementation("io.minio:minio:8.4.3")
    implementation("org.apache.commons:commons-pool2")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    implementation("io.github.oshai:kotlin-logging-jvm:6.0.3")
    implementation("org.babyfish.jimmer:jimmer-spring-boot-starter:${jimmerVersion}")

    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9")
    implementation("com.github.xiaoymin:knife4j-openapi3-jakarta-spring-boot-starter:4.5.0")

    implementation("com.auth0:java-jwt:4.4.0")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")

    runtimeOnly("com.mysql:mysql-connector-j")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.7.3")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
