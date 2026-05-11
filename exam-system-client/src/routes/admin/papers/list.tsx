import {createFileRoute} from '@tanstack/react-router'
import PapersPage from '#/features/admin/papers'
import {papersQueryOptions} from "#/features/admin/papers/paperQueries.ts";

export const Route = createFileRoute('/admin/papers/list')({
  component: PapersPage,
  loader: ({context}) => {
    context.queryClient.ensureQueryData(papersQueryOptions({ }))
  },
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: () => (
    <div className="p-8 text-center">加载试卷列表中...</div>
  ),
})
