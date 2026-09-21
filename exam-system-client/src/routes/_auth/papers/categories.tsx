import { createFileRoute } from '@tanstack/react-router'
import PaperCategoriesPage from '#/features/console/paper-categories'
import { paperCategoryTreeOptions } from '#/features/console/paper-categories/paperCategoryQueries.ts'

export const Route = createFileRoute('/_auth/papers/categories')({
  component: PaperCategoriesPage,
  // 必须 return：否则 loader 立刻 resolve，请求失败时会绕过路由的 errorComponent 直接 500
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(paperCategoryTreeOptions),
})
