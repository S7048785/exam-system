# exam-system 仓库指南

引用规则索引文件：`@role.md`（包含各模块详细规范、命令、坑点，按需加载）

## 项目结构

```
exam-system-client/  前端 - TanStack Start + React 19
exam-system-java/    后端 - Spring Boot 3.4.5 + Jimmer ORM + Sa-Token (Java 21, Maven)
exam-system-server/  ⚠ 忽略此项目，不要修改其代码
```

**不要修改 `exam-system-server/` 下的任何文件。**

## 关键命令

### 前端 (exam-system-client/)

包管理器必须用 **Bun**，`--bun` 前缀不可省略：

```bash
bun install              # 安装依赖
bun --bun run dev        # 开发服务器 → localhost:9919
bun --bun run build      # 生产构建
bun --bun run test       # Vitest（当前无测试文件，直接运行会失败）
bun --bun run lint       # ESLint
bun --bun run check      # Prettier --write + eslint --fix
bun run api              # 从后端下载 API 类型（后端需运行）
```

`bun run api` 将后端 `/api/ts.zip` 下载到 `src/__generated/`，**生成代码不要手动编辑**。

### 后端 Java (exam-system-java/)

```bash
mvnw.cmd install -pl entity -am -q -DskipTests   # entity 变更后先 install
mvnw.cmd compile -pl server                       # 再编译 server
mvnw.cmd test -pl server                          # 运行测试
```

**构建顺序必须遵守**：`entity` → `server`。entity 变更后必须先 `install` 再编译/运行 server。

## 后端架构要点

- **端口 8101**，上下文路径 `/api` (application.yml)
- **Maven 多模块**：`entity/`（Jimmer 实体 + DTO）+ `server/`（Controller/Service/Repository/Config）
- **Jimmer 实体**是 `interface`（不是 class），所有实体含软删除 `delFlag` + `createTime`/`updateTime`
- **DTO 定义**：Jimmer 生成的在 `entity/src/main/dto/*.dto`，手写请求/响应在 `entity/.../io/req`、`io/res`
- **错误处理**：业务异常统一抛 `BusinessException` → 422 `text/plain`；禁止直接抛 `RuntimeException`
- **认证**：Sa-Token，cookie `access_token`，超时 7200s
- **配置分层**：`application.yml` ← `application-dev.yml`（占位符）← `application-local.yml`（本地实际值）
- `application-local.yml` 和 `application-dev.yml` 含敏感信息，**不要提交到公开仓库**

### Java 已知坑点

- Jimmer Java API 的 `in()`/`notIn()` 是小写，不是 `valueIn`/`valueNotIn`
- `PaperSaveInput.questions` 类型是 `Map<String, Integer>`，不是 `Map<Long, Double>`
- `common/annotation/`、`common/aspect/`、`notice` 模块均为空/未实现

## 前端架构要点

- **`src/routes/`**：TanStack Router 文件路由，`routeTree.gen.ts` 自动生成，不要手动编辑
- **路径别名**：`#/` 和 `@/` 均映射到 `./src/`，优先用 `#/`
- **Tailwind v4**：CSS-first 配置（`src/styles.css`），`tailwind.config.js` 是 v3 死代码，勿用
- **shadcn/ui**：组件在 `src/components/ui/`，`cn()` 工具函数在 `src/lib/utils.ts`
- **状态管理**：`zustand` + `persist`（唯一 store：`src/stores/user.ts`）
- **API 实例**：`src/ApiInstance.ts`，SSR 阶段直连 `VITE_API_URL`，浏览器端走 Vite proxy `/api` → `localhost:8101`
- **生成代码**：`src/__generated/`、`routeTree.gen.ts`、`.tanstack/`、`.vinxi/`、`.nitro/`、`.output/` 均已 `.gitignore`，不要手动编辑或提交

## 基础设施（Docker Compose）

```bash
docker compose up -d   # 启动 MySQL、Valkey、CAPTCHA
```

- CAPTCHA 服务（`tiago2/cap`）：端口 8102
- Valkey（Redis 兼容）：内部端口 6379
- MySQL：端口 3306，数据库 `exam_system`
- MySQL MCP 在 `opencode.json` 中配置，密码通过 `env:DB_PASSWORD` 注入

## OpenCode 配置

`opencode.json` 引用本文件（`AGENTS.md`）作为指令，并配置了 MySQL MCP 服务（密码从环境变量 `DB_PASSWORD` 读取）。
