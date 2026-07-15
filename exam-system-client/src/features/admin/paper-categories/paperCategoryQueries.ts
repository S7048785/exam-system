import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'

export const paperCategoryTreeOptions = queryOptions({
  queryKey: ['paper-category-tree'],
  queryFn: () => api.paperCategoryController.tree(),
  staleTime: 10 * 60 * 1000,
})
