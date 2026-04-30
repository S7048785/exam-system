import ExamListPage from '#/features/exam/list'
import {paperListQueryOptions} from '#/features/exam/list/examQueries'
import {createFileRoute} from '@tanstack/react-router'
import z from 'zod'

export const Route = createFileRoute('/exam/list')({
  component: ExamListPage,
  validateSearch: z.object({
    keyword: z.string().optional(),
  }),
  loaderDeps: ({ search: { keyword } }) => ({ keyword }),
  loader: async ({ context, deps: { keyword } }) => {
    return context.queryClient.ensureQueryData(
      paperListQueryOptions({
        status: 'PUBLISHED',
        name: keyword,
      }),
    )
  },
})
