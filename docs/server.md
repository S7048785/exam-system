# Kotlin 后端规范 (exam-system-server)

## 构建
```bash
cd exam-system-server
./gradlew build          # 构建（含 KSP 代码生成）
./gradlew bootRun        # 运行（dev profile）
./gradlew test           # 运行测试
```

## 关键约定
- **Jimmer 实体**: `interface` 而非 class，使用 `@Entity`、`@Id`、`@Key`、`@ManyToOne`、`@LogicalDeleted`
- **DTO 定义**: `entity/src/main/dto/*.dto`（Jimmer DTO DSL 语法）
- **KSP 生成代码**: `build/generated/ksp/main/kotlin`
- **所有异常**: 使用 `BusinessException`
- **API 上下文路径**: `/api`，端口 8101
- **认证**: Sa-Token + JWT，token 名称 `exam-system-token`
