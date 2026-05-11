import {createFileRoute} from '@tanstack/react-router'
import CategoriesPage from '#/features/admin/categories'
import {categoryTreeOptions} from "#/features/admin/categories/categoryQueries.ts";

export const Route = createFileRoute('/admin/categories')({
  component: CategoriesPage,
  loader: ({context}) => {
    context.queryClient.ensureQueryData(categoryTreeOptions)
  }
})
