import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'

/**
 * 考试入口页的试卷信息（考生侧，免登录可访问）。
 *
 * 供 `loader` 里 `queryClient.ensureQueryData(...)` 与组件内 `useQuery` 共用同一份
 * queryKey —— 请求只在 loader 发生一次，组件直接吃缓存。
 */
export const examPaperInfoQueryOptions = (paperId: number) =>
  queryOptions({
    queryKey: ['examPaperInfo', paperId],
    queryFn: () => api.examController.getExamPaperInfo({ id: paperId }),
    retry: false,
  })
