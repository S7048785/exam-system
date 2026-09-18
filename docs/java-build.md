# Java 构建规范 (exam-system-java)

## 模块结构（3 个模块）

```
common ──> entity ──> server
```

| 模块 | 职责 | 被谁依赖 |
|------|------|---------|
| `common` | 常量 `constant/`、结果包装 `convention/`、配置属性 `property/`、异常 `exception/` | `entity`、`server` |
| `entity/` | Jimmer 实体 interface、`*.dto` DSL、`io/req` `io/res` | `server` |
| `server/` | Controller / Service / Repository / Config；`CaptchaService`、`RedisUtil`（`com.yyjy.exam.common.util`）也在这里 | — |

> ⚠️ `entity` 只依赖 `common`，**拿不到 WebFlux / Redis / servlet 容器**。
> 不要把 Web 或 Redis 相关代码塞进 `common`，否则 `entity` 会被动继承这些依赖 —— 需要就放 `server`。
> ⚠️ `com.yyjy.exam.common.*` 这个包**横跨两个模块**：`constant`/`convention`/`property`/`exception` 在 `common`，
> `config`/`auth`/`util` 在 `server`。

## 构建命令（Windows）
```bash
mvnw.cmd install -pl entity -am -q -DskipTests   # 改了 entity 或 common 后先执行
mvnw.cmd compile -pl server                       # 再编译 server
mvnw.cmd test -pl server                          # 运行测试
```

## 模块依赖顺序
`common` / `entity` 有变更后，必须先 `install` 再 `compile server`：
1. `mvnw.cmd install -pl entity -am -q -DskipTests`（`-am` 会连带重装 `common`）
2. `mvnw.cmd compile -pl server`

只改了 `server` 时，**不需要**重装 `entity`。

可选：需要用自定义本地仓库或 settings.xml 时，在这个基础上追加
```bash
set MAVEN_OPTS=-Dmaven.repo.local=<你的本地仓库路径>
mvnw.cmd ... -s <你的 settings.xml 路径>
```

## 实体模块包结构
```
com.yyjy.exam.entity.{domain}/
├── entity/          # Jimmer 实体 interface
├── io/req/          # 手写请求记录（Jakarta Validation 注解）
└── io/res/          # 手写响应记录
```

## Server 模块包结构
```
com.yyjy.exam.{domain}/
├── api/             # @RestController
├── service/         # @Service
└── repository/      # JRepository 接口
```

## 生成代码
Jimmer 生成代码在 `entity/target/generated-sources/annotations/`，编译 entity 模块时自动生成。
