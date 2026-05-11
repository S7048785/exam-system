plugins {
    kotlin("jvm")
    id("com.google.devtools.ksp")
}

group = "com.yyjy"
version = "0.0.1-SNAPSHOT"
description = "entity"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

val jimmerVersion: String by rootProject.extra
val springBootVersion: String by rootProject.extra

repositories {
    maven { url = uri("https://maven.aliyun.com/repository/public/") }
    mavenCentral()
}

dependencies {
//    implementation(platform("org.springframework.boot:spring-boot-dependencies:${springBootVersion}"))

    implementation("org.springframework.boot:spring-boot-starter-validation:${springBootVersion}")
    implementation("org.babyfish.jimmer:jimmer-core:${jimmerVersion}")
    compileOnly("org.babyfish.jimmer:jimmer-sql:${jimmerVersion}")
//    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("com.alibaba:easyexcel:3.1.0")
    implementation("com.github.xiaoymin:knife4j-openapi3-jakarta-spring-boot-starter:4.5.0")
    implementation("org.babyfish.jimmer:jimmer-spring-boot-starter:${jimmerVersion}")
    ksp("org.babyfish.jimmer:jimmer-ksp:${jimmerVersion}")
}

kotlin {
    sourceSets.main {
        kotlin.srcDir("build/generated/ksp/main/kotlin")
    }
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

ksp {
    arg("jimmer.dto.mutable", "true")
}
