import CreateEditPage from '#/features/admin/papers/components/CreateEditPage.tsx'
import { paperDetailQueryOptions } from '#/features/admin/papers/paperQueries'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/papers/$id/edit')({
  // 1. 在这里预取，利用 params.id
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      paperDetailQueryOptions(Number(params.id)),
    )
  },
  component: CreateEditPage,
})
