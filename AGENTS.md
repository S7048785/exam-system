# 规则加载说明

当遇到 `@docs/xxx.md` 时，请使用 read 工具加载。

- 不要一次性加载全部文件
- 按需加载
- 加载后必须遵守

# 规则索引

## 前端 (exam-system-client)

前端规范：@docs/client.md

## 后端 Kotlin (exam-system-server)

Kotlin 后端规范：@docs/server.md

## 后端 Java (exam-system-java)

Java 构建规范：@docs/java-build.md
Jimmer ORM 规范：@docs/java-jimmer.md
API 规范：@docs/java-api.md
已知坑点：@docs/java-pitfalls.md

## 基础设施

- CAPTCHA 服务（tiago2/cap）：端口 8102
- Valkey（Redis 兼容）：内部端口 6379
- API 端口：8101，上下文路径：`/api`

## 安全

`application-local.yml` 和 `application-dev.yml` 包含数据库密码、API 密钥等敏感信息，**不要提交到公开仓库**。
`application-dev.yml` 中的值（`HOST`、`API_KEY_DASHSCOPE` 等）是占位符。
