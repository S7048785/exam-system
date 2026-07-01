# 前端规范 (exam-system-client)

## 包管理器
使用 **Bun**，不要用 npm 或 pnpm。

## 核心命令
```bash
cd exam-system-client
bun install              # 安装依赖
bun --bun run dev        # 开发服务器 localhost:9919
bun --bun run build      # 生产构建
bun --bun run test       # Vitest 测试
bun --bun run lint       # ESLint
bun --bun run format     # Prettier 检查
bun --bun run check      # Prettier --write + eslint --fix
bun run api              # 从后端下载 API 类型（需后端运行中）
```

## 关键约定
- **文件路由**: `src/routes/` 中的文件自动映射为路由（TanStack Router）
- **路径别名**: `#/*` 和 `@/*` 均映射到 `./src/*`（代码中优先用 `#/`）
- **Prettier**: 无分号、单引号、尾逗号（见 `prettier.config.js`）
- **ESLint**: 基于 `@tanstack/eslint-config`，关闭了 `import/no-cycle`、`import/order`、`sort-imports`、`@typescript-eslint/array-type`、`@typescript-eslint/require-await`
- **React Compiler**: Vite 配置中启用了 `babel-plugin-react-compiler`
- **主题**: `next-themes` 管理 light/dark/auto，初始化脚本在 `__root.tsx`

## API 生成
`src/__generated/` 是从后端自动生成的，**不要手动编辑**。修改 API 类型需在后端进行。

## 环境变量
`.env` 文件中配置：
```
VITE_API_URL='http://localhost:8101'
VITE_CAP_URL='http://localhost:8102'
VITE_CAP_SITE_KEY='d33478bf69'
```
