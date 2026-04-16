import BannersPage from 'src/features/admin/banners'
import { createFileRoute } from '@tanstack/react-router'
import {bannerAllQueryOptions} from "#/features/admin/banners/bannerQueries.ts";

export const Route = createFileRoute('/admin/banners')({
  component: BannersPage,
  loader: async ({ context }) => {
    // 这行会让请求在路由加载阶段就开始，而不是等组件 mount
    await context.queryClient.ensureQueryData(bannerAllQueryOptions)
  },
  // 可选：控制 pending 行为（推荐设为 0，避免默认 500ms+ 延迟）
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: () => <div className="p-8">加载中...</div>
})
