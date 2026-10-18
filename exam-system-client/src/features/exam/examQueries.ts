import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'

import type { ExamTakingView } from '#/__generated/model/static'

/**
 * 考试入口页的试卷信息（考生侧，免登录可访问）。
 */
export const examPaperInfoQueryOptions = (paperId: number) =>
  queryOptions({
    queryKey: ['examPaperInfo', paperId],
    queryFn: () => api.examController.getExamPaperInfo({ id: paperId }),
    select: (res) => res.data,
    retry: false,
  })

/**
 * 当前登录考生的考试记录（`GET /exams/history`，**后端要求登录**）。
 *
 * @param paperId 传了就只查这张试卷（结果页的「历史成绩」用）；
 *                不传是该考生全部记录（入口页靠它判断「有没有考到一半」）
 */
export const examHistoryQueryOptions = (paperId?: number) =>
  queryOptions({
    queryKey: ['examHistory', paperId ?? 'all'],
    queryFn: () => api.examController.getExamHistory({ paperId }),
    select: (data) => data.data,
    retry: false,
  })
/**
 * 考试记录的对外标识：`publicId`（6 位短码）。
 */
export type ExamRecordId = string

/**
 * 答题页数据：`GET /exams/{publicId}/taking`（**不含正确答案**）。
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
 */
export const examResultQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: ['examResult', publicId],
    queryFn: () => api.examController.getExamResult({ publicId }),
    select: (res) => res.data,
    retry: false,
  })

/**
 * 考生侧答题详情：`GET /exams/{publicId}/detail`（含标准答案、对错与题目解析）。
 *
 * 结果页的「查看答案解析」弹窗用。后端三道闸：记录归属（匿名记录放行、登录记录要求本人）、
 * 未交卷（`ONGOING`）不返回、`showAnswerAfterSubmit` 关闭时 422。
 */
export const examDetailQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: ['examDetail', publicId],
    queryFn: () => api.examController.getExamDetail({ publicId }),
    select: (res) => res.data,
    retry: false,
  })
