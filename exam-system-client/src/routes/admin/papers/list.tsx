import {createFileRoute} from '@tanstack/react-router'
import PapersPage from '#/features/admin/papers'

export const Route = createFileRoute('/admin/papers/list')({
  component: PapersPage,
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: () => (
    <div className="p-8 text-center">加载试卷列表中...</div>
  ),
})
