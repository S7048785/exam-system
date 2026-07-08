import { createFileRoute } from '@tanstack/react-router'
import CreateEditPage from '#/features/admin/papers/create/CreateEditPage.tsx'

export const Route = createFileRoute('/admin/papers/create')({
  component: CreateEditPage,
  pendingComponent: () => <div className="p-8 text-center">加载中...</div>,
})
