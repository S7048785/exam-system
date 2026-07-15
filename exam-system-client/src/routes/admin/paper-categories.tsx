import { createFileRoute } from '@tanstack/react-router'
import PaperCategoriesPage from '#/features/admin/paper-categories'
import { paperCategoryTreeOptions } from '#/features/admin/paper-categories/paperCategoryQueries.ts'

export const Route = createFileRoute('/admin/paper-categories')({
  component: PaperCategoriesPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(paperCategoryTreeOptions)
  },
})
