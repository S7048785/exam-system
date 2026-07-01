import BannersPage from '#/features/admin/banners'
import { createFileRoute } from '@tanstack/react-router'
import { bannerAllQueryOptions } from '#/features/admin/banners/bannerQueries.ts'

export const Route = createFileRoute('/admin/banners')({
  component: BannersPage,
  loader: ({ context }) => {
    // 预取数据但不阻塞路由跳转，组件内的 useSuspenseQuery 会处理悬挂状态
    context.queryClient.ensureQueryData(bannerAllQueryOptions)
  },
  // 控制 pending 行为
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: () => <div className="p-8">加载中...</div>,
})
