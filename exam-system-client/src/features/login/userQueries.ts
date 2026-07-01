import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'

export const getUserInfoQueryOptions = queryOptions({
  queryKey: ['userInfo'],
  queryFn: () => api.userController.getUserInfo(),
})
