plugins {
    kotlin("jvm")
    kotlin("plugin.serialization")
    id("com.google.devtools.ksp")
}

description = "entity"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

val jimmerVersion: String by rootProject.extra
val springBootVersion: String by rootProject.extra
val easyexcelVersion: String by rootProject.extra

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:${springBootVersion}"))
    implementation("org.babyfish.jimmer:jimmer-core:${jimmerVersion}")
    compileOnly("org.babyfish.jimmer:jimmer-sql:${jimmerVersion}")
    api("com.alibaba:easyexcel:${easyexcelVersion}")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("com.fasterxml.jackson.core:jackson-annotations")
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("io.swagger.core.v3:swagger-annotations-jakarta:2.2.0")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
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
