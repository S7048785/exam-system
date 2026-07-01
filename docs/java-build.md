# Java 构建规范 (exam-system-java)

## 构建命令（Windows）
```bash
set MAVEN_OPTS=-Dmaven.repo.local=path\to\mvn_repo
mvnw.cmd install -pl entity -am -q -DskipTests -s path\to\settings.xml
mvnw.cmd compile -pl server -s path\to\settings.xml
mvnw.cmd test -pl server -s path\to\settings.xml
```

## 模块依赖顺序
每次 `entity` 模块有变更后，必须先 `install entity` 再 `compile server`：
1. `mvnw.cmd install -pl entity -am -q -DskipTests -s ...`
2. `mvnw.cmd compile -pl server -s ...`

## 模块职责
| 模块 | 源码目录 | 说明 |
|------|---------|------|
| `entity/` | `src/main/java/com/yyjy/exam/entity/` | Jimmer 实体 interface、IO 请求/响应、DTO DSL |
| `server/` | `src/main/java/com/yyjy/exam/` | Controller / Service / Repository / Config |

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
