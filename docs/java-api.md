# API 规范 (exam-system-java)

## 成功响应
```java
R.ok()            // code=200, msg="ok", data=null
R.ok(data)        // code=200, msg="ok", data=xxx
PageRes<T>        // @Builder 记录: total, page, pageSize, list
```
Content-Type: `application/json`。

## 错误响应

所有业务异常统一使用 `BusinessException`，**禁止**直接抛 `RuntimeException` 或 `ResponseStatusException`。

```java
throw new BusinessException("错误消息");
```

由 `GlobalExceptionHandler` 统一处理，返回 `text/plain`，不使用 `R` 包装：

| 异常类型 | HTTP 状态码 | Content-Type | 响应体 |
|---------|------------|-------------|--------|
| `BusinessException` | **422** Unprocessable Entity | `text/plain` | 错误消息原文 |
| `MaxUploadSizeExceededException` | **413** Payload Too Large | `text/plain` | "上传文件过大" |
| 其他 `Exception` | **500** Internal Server Error | `text/plain` | "服务器内部错误"（不泄露任何内部细节） |

非业务异常（如 NPE、IO 异常）在服务端日志中打印完整堆栈，但不返回给前端。

## 认证
- Sa-Token，cookie 名称：`access_token`，超时：7200s
- 公开路径在 `application-dev.yml` 的 `exam.exclude.path` 中配置
- 获取当前用户 ID：`StpUtil.getLoginIdAsLong()`

## 配置分层
`application.yml`（基础）← `application-dev.yml`（占位符）← `application-local.yml`（本地实际值）
`exam.*` 前缀绑定到 `common/property/*Properties.java` 中。

## 常规定义文件
- `common/constant/MessageConstant.java` — 错误消息常量（`question:xxx` / `paper:xxx` 格式）
- `common/constant/CacheConstant.java` — Redis 缓存 key
- `common/constant/PromptConstant.java` — AI 提示词模板（无 `trimIndent()`，缩进即文本一部分）
