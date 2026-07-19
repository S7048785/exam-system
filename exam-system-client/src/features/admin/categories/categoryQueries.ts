import { api } from '#/ApiInstance.ts'
import { queryOptions } from '@tanstack/react-query'

export const categoryTreeOptions = queryOptions({
  queryKey: ['categoryTree'],
  queryFn: () => api.questionCategoryController.tree(),
})
