import { api } from '#/ApiInstance.ts'
import { queryOptions } from '@tanstack/react-query'

export const dashboardStatsOptions = queryOptions({
  queryKey: ['dashboardStats'],
  queryFn: () => api.dashboardController.stats(),
  refetchInterval: 30_000,
})
