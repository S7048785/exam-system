import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'

export interface UserListParams {
  keyword?: string
  page?: number
  size?: number
}

export const usersQueryOptions = (params: UserListParams) =>
  queryOptions({
    queryKey: ['admin-users', params],
    queryFn: () =>
      api.userController.listUsers({
        keyword: params.keyword,
        page: params.page,
        size: params.size,
      }),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  })
