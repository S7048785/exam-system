# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exam System Backend - Spring Boot 3 + Kotlin REST API server using Jimmer ORM for database access.

**Tech Stack**: Kotlin 2.1, Spring Boot 3.4.5, Jimmer ORM 0.10.6, MySQL, Redis, MinIO, Sa-Token JWT

## Build Commands

```bash
# Build
./gradlew build

# Run (dev profile active by default)
./gradlew bootRun

# Run tests
./gradlew test

# Run single test class
./gradlew test --tests "com.yyjy.BackendSpringbootApplicationTests"

# Clean and rebuild (clears KSP generated code)
./gradlew clean build
```

**KSP Code Generation**: Jimmer generates implementation classes via KSP. Generated code goes to `build/generated/ksp/main/kotlin`. Run `build` after creating/modifying entities.

## Architecture

```
controller/    → REST endpoints, @Tag/@Operation for Swagger
service/       → Business logic, @Service
repository/   → Jimmer KRepository interfaces
models/entity/ → Jimmer entity interfaces (NOT classes)
models/req/    → Request DTOs
common/        → R<T>, PageRes<T>, BusinessException, BaseContext
config/        → Spring configuration classes
aspect/        → AOP aspects (e.g., ApiOperationLogAspect)
interceptor/   → TokenInterceptor for JWT auth
utils/         → JwtUtil, MinioUtil, ImageSafeChecker
```

## Key Patterns

### Entity Definition (Jimmer)
- Entities are **interfaces**, not classes
- Use `@Entity`, `@Id`, `@Key`, `@ManyToOne`, `@OneToMany`, `@LogicalDeleted`
- Logical deletion: `@Column(name = "is_deleted") @Default("0") @LogicalDeleted("1") val delFlag: Int`
- See `AI_Jimmer_Entity_Gen.md` for detailed mapping rules

### API Response Format
```kotlin
R.ok()                    // 200, msg="ok"
R.ok(data)                // 200 with data
R.fail("error message")   // 500 with error

data class PageRes<T>(
    var total: Long = 0,
    var page: Int = 1,
    var page_size: Int = 10,
    var list: List<T>
)
```

### Repository Pattern
```kotlin
interface UsersRepository : KRepository<Users, Long> {
    // Jimmer auto-generates CRUD + query DSL
}
```

### Authentication
- Sa-Token with JWT, token name: `exam-system-token`
- `exclude.path` in `application-dev.yml` lists public endpoints
- `TokenInterceptor` validates tokens on protected routes

### Configuration
- `application.yml` - base config, Jimmer settings
- `application-dev.yml` - dev environment secrets (datasource, jwt, minio)
- `application-local.yml` - local overrides
- `ExamProperties.kt` binds `exam.*` prefix

## Jimmer ORM Reference

The `.agents/skills/jimmer-orm/` directory contains detailed guidance:
- `SKILL.md` - core concepts and workflow
- `references/entity-mapping.md` - entity mapping rules
- `references/dsl-queries.md` - query DSL patterns
- `references/dto.md` - DTO definition

Key rules:
- Interface + annotations for entities
- Kotlin nullable (`?`) for optional fields
- `@Key` for unique constraints
- `@ManyToOne` auto-infers foreign key from property name
- KSP generates implementation at compile time
