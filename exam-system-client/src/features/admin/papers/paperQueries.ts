import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type {
  PaperAiSaveDto,
  PaperSaveInput,
  PaperUpdateInput,
} from '#/__generated/model/static'
import type { PaperControllerOptions } from '#/__generated/services/PaperController'

export const papersQueryOptions = (
  filters: PaperControllerOptions['listPapers'],
) =>
  queryOptions({
    queryKey: ['papers', filters],
    queryFn: () => api.paperController.listPapers(filters),
    staleTime: 30 * 1000,
  })

export const paperDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['paper', id],
    queryFn: () => api.paperController.getPaper({ id }),
    staleTime: 30 * 1000,
  })

export const paperQueries = {
  list: papersQueryOptions,
  detail: paperDetailQueryOptions,
  add: (input: PaperSaveInput) => api.paperController.addPaper({ body: input }),
  update: (input: PaperUpdateInput) =>
    api.paperController.updatePaper({ body: input }),
  remove: (id: number) => api.paperController.removePaper({ id }),
  aiGenerate: (input: PaperAiSaveDto) =>
    api.paperController.aiPaper({ body: input }),
}
