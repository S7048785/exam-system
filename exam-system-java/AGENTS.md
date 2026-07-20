# exam-system-java 后端指南

Spring Boot 3.4.5 + Jimmer ORM 0.10.6 + Sa-Token 1.44.0 (Java 21, Maven 多模块)

## 构建与运行

```bash
mvnw.cmd install -pl entity -am -q -DskipTests   # entity 变更后必须先执行
mvnw.cmd install -pl common -am -q -DskipTests   # common 变更后必须先执行
mvnw.cmd compile -pl server                       # 再编译 server
mvnw.cmd test -pl server                          # 运行测试
mvnw.cmd spring-boot:run -pl server               # 启动（端口 8101，上下文 /api）
```

**构建顺序必须为 entity → common → server**，不可颠倒。entity/common 变更后务必先 `install` 再编译/运行。

## Jimmer 实体规范

- 实体是 **`interface`**，不是 class
- 所有实体含软删除：`@LogicalDeleted("now") LocalDateTime delFlag()`（列名 `deleted_at`）
- DTO 定义在 `entity/src/main/dto/*.dto`，编译时生成 Java 代码；修改后需重新 `install entity`
- 手写请求/响应放在 `entity/.../io/req`、`io/res`
- `jimmer.database-validation-mode: ERROR` — 实体与数据库表不一致时启动失败

## 接口规范

- 正常响应：`R.ok(data)` → 200 JSON `{ code, msg, data }`
- 业务异常：抛 `BusinessException` → 422 `text/plain`
- 全局异常在 `GlobalExceptionHandler.java`，禁止直接抛 `RuntimeException`
- 认证：Sa-Token cookie `access_token`（超时 7200s），测试用 `@TestPropertySource(properties = "exam.exclude.path[0]=/**")` 绕过

## 测试

- 使用 `@MockitoBean`（路径 `org.springframework.test.context.bean.override.mockito`），**不是** `@MockBean`
- 测试类在 `server/src/test/java/com/yyjy/exam/`

## 已知坑点

- Jimmer Java API 的 `in()`/`notIn()` 是小写，不是 `valueIn`/`valueNotIn`
- `PaperSaveInput.questions` 类型是 `Map<String, Integer>`（key 是题目 ID 字符串，value 是分数）
- 配置使用 `${exam.*}` 占位符，需在 `application-dev.yml` 中定义实际值
- 应用启用懒加载（`lazy-initialization: true`），首次请求可能较慢
- `common/config/`、`common/auth/` 留在 server 模块（依赖 sa-token 和 server 内部类）
- `notice` 模块未实现
