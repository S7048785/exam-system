# exam-system-client 前端指南

## 关键命令

包管理器必须用 **Bun**，所有命令在本目录执行：

```bash
bun install              # 安装依赖
bun --bun run dev        # 开发服务器 → localhost:9919
bun --bun run build      # 生产构建
bun --bun run test       # Vitest（当前无测试文件）
bun --bun run lint       # ESLint
bun --bun run check      # Prettier --write + eslint --fix
bun run api              # 从后端 /api/ts.zip 下载 API 类型到 src/__generated/（后端需运行）
```

- `bun --bun run` 前缀**不可省略**，确保使用 Bun 运行时而非 Node。
- 当前仓库**没有测试文件**，直接 `bun --bun run test` 会失败。

## 架构要点

### 路由与权限

- **`src/routes/`**：TanStack Router 文件路由，`routeTree.gen.ts` 为自动生成，**不要手动编辑**（`.gitignore` 且 VSCode
  设为只读）。
- **`src/routeTree.gen.ts`** 在添加/删除路由文件后自动更新，无需手动操作。
- 三个路由布局组（`_auth`, `_public`, `admin`）：
  - `_auth/` — 登录/注册，**无身份校验**
  - `_public/` — 需登录（`beforeLoad` 中检查 `useUserStore`）
  - `admin/` — 需 `role === 'admin'`，使用 `ssr: false`（仅客户端渲染）
  - `exam/` — 需登录
- `src/features/` 按业务模块组织（`admin/`, `exam/`, `login/`），与路由一一对应。

### API 与数据

- **`src/ApiInstance.ts`**：SSR 阶段直连 `VITE_API_URL`（`localhost:8101`），浏览器端走 Vite
  proxy `/api` → `localhost:8101`。
- **`src/__generated/`**：从后端自动生成的 API 客户端，**不要手动编辑**（`.gitignore`）。运行 `bun run api` 重新生成。
- **状态管理**：`zustand` + `persist`（localStorage），唯一 store 是 `src/stores/user.ts`。
- **服务端状态**：TanStack Query，`QueryClient` 实例在 `src/integrations/tanstack-query/root-provider.tsx` 管理。

### 样式与 UI

- **Tailwind v4**：CSS-first 配置在 `src/styles.css`（`@import 'tailwindcss'`），**`tailwind.config.js` 是 v3 死代码，不要使用
  **。
- **shadcn/ui**：组件在 `src/components/ui/`，使用 `#/components/ui/*` 导入。
- **`cn()` 工具函数**：在 `src/lib/constants.ts` 中，合并 class 时优先使用。
- **主题**：`next-themes` + 内联脚本防闪烁（`__root.tsx`）。
- **CAPTCHA**：`@pitininja/cap-react-widget`，样式变量在 `styles.css` 的 `cap-widget` 部分。
- **Prettier**：无分号、单引号、尾逗号。

### 路径别名

`#/` 和 `@/` 均映射到 `./src/`，代码中优先用 `#/`。

### 生成与缓存文件

- `routeTree.gen.ts`、`src/__generated/`、`.tanstack/`、`.vinxi/`、`.nitro/`、`.output/`
  均为生成/构建产物，已加入 `.gitignore`，**不要手动编辑或提交**。

## 依赖说明

- `@tanstack/react-router`、`@tanstack/react-query`、`@tanstack/react-form-start` 使用 `"latest"` 版本标签，构建不可复现。
- React Compiler 通过 `babel-plugin-react-compiler` 启用（配置在 `vite.config.ts`）。
- `use-immer` 用于复杂状态更新。
- `zod` v4 用于表单验证。
- `recharts`、`motion`、`react-skinview3d` 无懒加载，全量打包。
