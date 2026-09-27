import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type { PaperAiSaveDto, PaperListQuery } from '#/__generated/model/static'

export const papersQueryOptions = (filters: PaperListQuery) =>
  queryOptions({
    queryKey: ['listPapers', filters],
    queryFn: () => api.paperController.listPapers({ query: filters }),
    staleTime: 30 * 1000,
  })

export const paperDetailQueryOptions = (id: number, enabled: boolean) =>
  queryOptions({
    queryKey: ['paperDetail', id],
    queryFn: () => api.paperController.getPaper({ id }),
    staleTime: 30 * 1000,
    enabled,
  })

export const paperQueries = {
  list: papersQueryOptions,
  detail: paperDetailQueryOptions,
  remove: (id: number) => api.paperController.removePaper({ id }),
  aiGenerate: (input: PaperAiSaveDto) =>
    api.paperController.aiPaper({ body: input }),
}
