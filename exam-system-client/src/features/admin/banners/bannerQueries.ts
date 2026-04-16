// src/queries/bannerQueries.ts
import { queryOptions } from '@tanstack/react-query'
import {api} from '#/ApiInstance.ts'

export const bannerAllQueryOptions = queryOptions({
	queryKey: ['bannerAll'],
	queryFn: () => api.bannerController.getAllBanners(),
	// 可选：根据业务调整
	staleTime: 5 * 60 * 1000,   // 5分钟内视为新鲜
	gcTime: 10 * 60 * 1000,     // 缓存保留时间
})