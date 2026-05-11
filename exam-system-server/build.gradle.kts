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

allprojects {
    group = "com.yyjy"
    version = "0.0.1-SNAPSHOT"
}

subprojects {
    repositories {
        mavenCentral()
    }

    tasks.register<Wrapper>("wrapper") {
        gradleVersion = "8.14.4"
        distributionType = Wrapper.DistributionType.BIN
    }

    // IDE may invoke this task on subprojects during Gradle sync.
    tasks.register("prepareKotlinBuildScriptModel") {
        group = "ide"
        description = "Compatibility task for IDE Gradle sync."
    }
}
