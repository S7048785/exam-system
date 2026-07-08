import ExamListPage from '#/features/exam/list'
import { paperListQueryOptions } from '#/features/exam/list/examQueries.ts'
import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { PAPER_STATUS } from '#/features/admin/papers/constants.ts'

export const Route = createFileRoute('/_auth/exam/list')({
  component: ExamListPage,
  validateSearch: z.object({
    keyword: z.string().optional(),
  }),
  loaderDeps: ({ search: { keyword } }) => ({ keyword }),
  loader: async ({ context, deps: { keyword } }) => {
    return context.queryClient.fetchQuery(
      paperListQueryOptions({
        status: PAPER_STATUS.PUBLISHED,
        name: keyword,
      }),
    )
  },
})
