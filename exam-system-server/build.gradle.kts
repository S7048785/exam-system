plugins {
    kotlin("jvm") version "2.1.0" apply false
    kotlin("plugin.spring") version "2.1.0" apply false
    id("org.springframework.boot") version "3.4.5" apply false
    id("com.google.devtools.ksp") version "2.1.0-1.0.29" apply false
    kotlin("plugin.serialization") version "2.1.0" apply false
}

group = "com.yyjy"
version = "0.0.1-SNAPSHOT"
description = "exam-system-server"

val jimmerVersion by extra { "0.10.6" }
val springBootVersion by extra { "3.4.5" }
extra["easyexcelVersion"] = "3.1.0"
extra["knife4jVersion"] = "4.5.0"
extra["kotlinxCoroutinesVersion"] = "1.7.3"
extra["ktorVersion"] = "2.3.7"
extra["hutoolVersion"] = "5.8.42"
extra["springAiVersion"] = "1.1.2.0"

allprojects {
    group = "com.yyjy"
    version = "0.0.1-SNAPSHOT"
}

subprojects {
    plugins.apply("java-library")
    plugins.apply("org.springframework.boot")
    plugins.apply("io.spring.dependency-management")

    repositories {
        maven { url = uri("https://maven.aliyun.com/repository/public/") }
        maven { url = uri("https://maven.aliyun.com/repositories/google") }
        maven { url = uri("https://maven.aliyun.com/repositories/central") }
        mavenCentral()
    }

    dependencies {
        "implementation"("org.babyfish.jimmer:jimmer-spring-boot-starter:${jimmerVersion}")
    }

    tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
        enabled = false
    }
    tasks.named<Jar>("jar") {
        enabled = true
    }

    tasks.register("prepareKotlinBuildScriptModel") {
        group = "ide"
        description = "Compatibility task for IDE Gradle sync."
    }
}
