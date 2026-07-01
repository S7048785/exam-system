import { createFileRoute } from '@tanstack/react-router'
import CreateEditPage from '#/features/admin/papers/components/CreateEditPage.tsx'

export const Route = createFileRoute('/admin/papers/create')({
  component: CreateEditPage,
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: () => <div className="p-8 text-center">加载中...</div>,
})
