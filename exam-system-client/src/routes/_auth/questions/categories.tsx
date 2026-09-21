import { createFileRoute } from '@tanstack/react-router'
import CategoriesPage from '#/features/console/categories'
import { categoryTreeOptions } from '#/features/console/categories/categoryQueries.ts'

export const Route = createFileRoute('/_auth/questions/categories')({
  component: CategoriesPage,
  // 必须 return：否则 loader 立刻 resolve，请求失败时会绕过路由的 errorComponent 直接 500
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(categoryTreeOptions),
})
