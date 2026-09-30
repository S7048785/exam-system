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

/**
 * 当前登录考生的全部考试记录（`GET /exams/history`，**后端要求登录**）。
 *
 * 入口页用它判断「我」在这张试卷上考到哪一步了：后端 `startExam` 的续考就是复用同一条
 * 未交卷的 `ONGOING` 记录，所以有 ONGOING 就说明是考到一半，按钮该显示「继续考试」。
 *
 * 拿不到不是异常：未登录、或这场是**免登录考试**（它的记录 `user_id` 为空，
 * 而 history 是按 userId 查的）都返回不了，此时按「未考试」渲染即可。
 */
export const examHistoryQueryOptions = queryOptions({
  queryKey: ['examHistory'],
  queryFn: () => api.examController.getExamHistory(),
  select: (data) => data.data,
  retry: false,
})
