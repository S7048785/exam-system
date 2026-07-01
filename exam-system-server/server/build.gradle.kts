plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    id("org.springframework.boot")
    kotlin("plugin.serialization")
    id("com.google.devtools.ksp")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

description = "server"

val jimmerVersion: String by rootProject.extra
val springBootVersion: String by rootProject.extra
val knife4jVersion: String by rootProject.extra
val kotlinxCoroutinesVersion: String by rootProject.extra
val ktorVersion: String by rootProject.extra
val hutoolVersion: String by rootProject.extra
val springAiVersion: String by rootProject.extra

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:${springBootVersion}"))

    implementation(project(":entity"))

//    implementation("org.redisson:redisson-spring-boot-starter:3.52.0")
    implementation("cn.hutool:hutool-crypto:${hutoolVersion}")
    implementation("cn.hutool:hutool-json:${hutoolVersion}")
    implementation("org.springframework.security:spring-security-crypto:7.0.0")

    implementation("io.ktor:ktor-client-core:${ktorVersion}")
    implementation("io.ktor:ktor-client-cio:${ktorVersion}")
    implementation("io.ktor:ktor-client-content-negotiation:${ktorVersion}")
    implementation("io.ktor:ktor-serialization-kotlinx-json:${ktorVersion}")

    implementation("com.alibaba.cloud.ai:spring-ai-alibaba-starter-dashscope:${springAiVersion}")
    implementation("com.alibaba.cloud.ai:spring-ai-alibaba-agent-framework:${springAiVersion}")

    implementation("org.springframework.boot:spring-boot-starter-aop")
    implementation("org.apache.tika:tika-core:2.9.1")
    implementation("io.minio:minio:8.4.3")
    implementation("org.apache.commons:commons-pool2")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    implementation("io.github.oshai:kotlin-logging-jvm:6.0.3")

    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.9")
    implementation("com.github.xiaoymin:knife4j-openapi3-jakarta-spring-boot-starter:${knife4jVersion}")

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

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:${kotlinxCoroutinesVersion}")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor:${kotlinxCoroutinesVersion}")
    ksp("org.babyfish.jimmer:jimmer-ksp:${jimmerVersion}")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
