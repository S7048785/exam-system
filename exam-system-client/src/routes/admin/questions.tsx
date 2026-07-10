import QuestionsPage from '#/features/admin/questions'
import { categoryTreeQueryOptions } from '#/features/admin/questions/questionQueries.ts'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/questions')({
  component: QuestionsPage,
  loader: async ({ context }) => {
    // 提前预取分类（静态，几乎不影响性能）
    context.queryClient.ensureQueryData(categoryTreeQueryOptions)
    // 提前预取题目列表（使用当前 search 参数）
    // context.queryClient.ensureQueryData(
    //   questionsQueryOptions({
    //     page: 1,
    //     size: 10,
    //   }),
    // )
  },
  pendingComponent: () => {
    return <div>加载中</div>
  },
  // pendingMs: 0, // 设置为0, 只要路由跳转，立刻显示 pendingComponent
  // pendingMinMs: 0, // pendingComponent最小显示时间
  // pendingComponent: () => (
  //   <div className="p-8 text-center">加载题目列表中...</div>
  // ), // 可替换成骨架屏
})
