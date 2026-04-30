# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

考试系统客户端，基于 TanStack Start 构建的 React 全栈应用，使用文件路由系统和 TanStack Query 进行服务端状态管理。

## 开发命令

```bash
bun install          # 安装依赖
bun --bun run dev    # 启动开发服务器 (localhost:9919)
bun --bun run build  # 构建生产版本
bun --bun run test   # 运行 Vitest 测试
bun --bun run lint   # ESLint 检查
bun --bun run format # Prettier 格式化
bun --bun run check  # 格式化和修复
bun run api          # 从后端下载并生成 API 类型和服务
```

## 技术栈

- **框架**: TanStack Start (基于 TanStack Router 的文件路由)
- **UI**: Tailwind CSS v4 + shadcn 风格组件
- **状态管理**: TanStack Query (服务端状态), React Context (主题等)
- **样式**: Tailwind CSS + CSS 变量实现主题切换
- **包管理**: Bun (构建依赖使用 pnpm)

## 目录结构

```
src/
├── __generated/          # API 自动生成目录（从后端下载）
│   ├── Api.ts            # API 客户端类
│   ├── model/            # DTO 和类型定义
│   └── services/        # 各模块 API 服务
├── components/           # 共享 UI 组件
│   ├── ui/              # shadcn 风格组件
│   ├── data-table.tsx   # 通用数据表格
│   └── BannerImageUpload.tsx
├── features/             # 功能模块（按领域组织）
│   └── admin/           # 管理后台功能
│       ├── banners/     # 轮播图管理
│       ├── categories/  # 分类管理
│       └── dashboard/   # 仪表盘
├── routes/               # 路由文件（TanStack Router 文件路由）
│   ├── __root.tsx       # 根路由（布局、错误处理）
│   ├── admin/           # 管理后台路由
│   └── _public/         # 公开路由
├── integrations/         # 外部服务集成
│   └── tanstack-query/  # TanStack Query 配置
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具函数
├── ApiInstance.ts        # 全局 API 实例配置
├── router.tsx            # 路由创建
└── routeTree.gen.ts      # 自动生成的路由树
```

## API 生成

API 从后端服务自动生成。运行 `bun run api` 会：

1. 从 `VITE_API_URL` 下载 TypeScript 类型定义 zip
2. 解压到 `src/__generated/` 目录
3. 生成 `Api` 类、各 Controller 服务和 DTO 类型

使用示例：

```typescript
import { api } from '#/ApiInstance.ts'
// 调用 API
const banners = await api.bannerController.getAllBanners()
```

## 路由模式

TanStack Router 使用文件路由：

- `src/routes/` 中的文件自动映射为路由
- 嵌套路由通过目录结构实现
- 路由文件导出 `Route` 对象

管理后台路由：`/admin/*`（dashboard, banners, categories, questions）

## 主题系统

使用 `next-themes` 实现主题切换，支持 light/dark/auto 三种模式。主题初始化脚本在 `__root.tsx` 中通过 `THEME_INIT_SCRIPT` 注入。

## 环境变量

`.env` 文件包含：

```
VITE_API_URL='localhost:8101'  # 后端 API 地址
```
