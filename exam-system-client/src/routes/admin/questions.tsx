import { createFileRoute } from '@tanstack/react-router'
import QuestionsPage from '#/features/admin/questions'
import {categoryTreeQueryOptions, questionsQueryOptions} from "#/features/admin/questions/questionQueries.ts";

export const Route = createFileRoute('/admin/questions')({
  component: QuestionsPage,

  loader: async ({ context}) => {
    // 提前预取分类（静态，几乎不影响性能）
    await context.queryClient.ensureQueryData(categoryTreeQueryOptions)

    // 提前预取题目列表（使用当前 search 参数）
    await context.queryClient.ensureQueryData(questionsQueryOptions({
      page: 1,
      size: 10
    }))
  },

  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: () => <div className="p-8 text-center">加载题目列表中...</div>, // 可替换成你的骨架屏
})
