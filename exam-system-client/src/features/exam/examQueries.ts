import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'

import type { ExamTakingView } from '#/__generated/model/static'

/**
 * 考试入口页的试卷信息（考生侧，免登录可访问）。
 *
 * 供 `loader` 里 `queryClient.ensureQueryData(...)` 与组件内 `useQuery` 共用同一份
 * queryKey —— 请求只在 loader 发生一次，组件直接吃缓存。
 *
 * `select` 直接取 `data`：调用方拿到的就是**非空**的试卷信息，不必再写 `res.data`
 * 并一路 `info?.`（同 `examTakingQueryOptions` 的写法）。
 */
export const examPaperInfoQueryOptions = (paperId: number) =>
  queryOptions({
    queryKey: ['examPaperInfo', paperId],
    queryFn: () => api.examController.getExamPaperInfo({ id: paperId }),
    select: (res) => res.data,
    retry: false,
  })

/**
 * 当前登录考生的全部考试记录（`GET /exams/history`，**后端要求登录**）。
 *
 * 入口页用它判断「我」在这张试卷上考到哪一步了：后端 `startExam` 的续考就是复用同一条
 * 未交卷的 `ONGOING` 记录，所以有 ONGOING 就说明是考到一半，按钮该显示「继续考试」。
 */
export const examHistoryQueryOptions = queryOptions({
  queryKey: ['examHistory'],
  queryFn: () => api.examController.getExamHistory(),
  select: (data) => data.data,
  retry: false,
})
/**
 * 考试记录的对外标识：`publicId`（6 位短码）。
 *
 * 自增 `exam_records.id` 只在后端内部用，接口不返回也不要传 —— 所有考试记录相关接口
 * （taking / answers / submit / detail / result）都按这个短码定位。
 */
export type ExamRecordId = string

/**
 * 答题页数据：`GET /exams/{publicId}/taking`（**不含正确答案**）。
 *
 * 返回里的 `answerRecords` 是这场考试**已经保存过的答案**，继续考试时用它把勾选状态恢复出来
 * （见 `answerRecordsToMap`）。
 */
export const examTakingQueryOptions = (recordId: ExamRecordId) =>
  queryOptions({
    queryKey: ['examTaking', recordId],
    queryFn: () => api.examController.getExamTaking({ publicId: recordId }),
    select: (res): ExamTakingView => res.data,
    retry: false,
  })

/**
 * 考试结果：`GET /exams/result/{publicId}`（免登录）。
 *
 * 只有 `GRADED` 才有结果，`ONGOING` / `GRADING` 后端回 422「试卷未提交」，
 * 由路由的 `errorComponent` 统一渲染（同入口页）。
 */
export const examResultQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: ['examResult', publicId],
    queryFn: () => api.examController.getExamResult({ publicId }),
    select: (res) => res.data,
    retry: false,
  })
