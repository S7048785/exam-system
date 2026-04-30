// src/queries/questionQueries.ts
import {queryOptions} from '@tanstack/react-query'
import {api} from '#/ApiInstance.ts'
import type {QuestionListReq} from '#/__generated/model/static'

export const categoryTreeQueryOptions = queryOptions({
  queryKey: ['categoryTree'],
  queryFn: () => api.categoryController.tree(),
  staleTime: 10 * 60 * 1000, // 10分钟缓存
})

export const questionsQueryOptions = (filters: QuestionListReq) =>
  queryOptions({
    queryKey: ['questions', filters],
    queryFn: () => api.questionController.listQuestions({ req: filters }),
    staleTime: 30 * 1000, // 列表数据缓存短一些
  })
