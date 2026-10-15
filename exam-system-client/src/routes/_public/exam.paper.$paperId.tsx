import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { ExamNotice } from '#/features/exam/paper/ExamNotice.tsx'
import { ExamPaper } from '#/features/exam/paper/ExamPaper.tsx'
import { examTakingQueryOptions } from '#/features/exam/examQueries.ts'

/**
 * 答题页 `/exam/paper/{paperId}?recordId={考试记录 id}`（免登录可访问）。
 *
 * 流程：入口页点「开始考试 / 继续考试」→ `POST /exams/start` 拿到考试记录 id（雪花，**字符串**）
 * → 带在 `?recordId=` 跳到本页 → `GET /exams/{recordId}/taking` 取题目。
 *
 * 动作按钮是**先存后交**：未保存 → `POST /exams/{recordId}/answers`；已保存 → `POST /exams/submit/{recordId}`。
 * 后端交卷时**不落库答案**，是按已保存的答案批改的，所以这个顺序不能省。
 */
export const Route = createFileRoute('/_public/exam/paper/$paperId')({
  validateSearch: z.object({ recordId: z.string().optional() }),
  loaderDeps: ({ search }) => ({ recordId: search.recordId }),
  loader: async ({ context, deps }) => {
    if (!deps.recordId) return
    // 用 prefetchQuery 而不是 ensureQueryData：记录查不到（422「考试记录不存在」等）时不该把整页
    // 推进 errorComponent —— 页面里有自己的「无法进入考试」兜底，预取失败就交给它。
    await context.queryClient.prefetchQuery(
      examTakingQueryOptions(deps.recordId),
    )
  },
  component: ExamTakingPage,
})

function ExamTakingPage() {
  const { paperId } = Route.useParams()
  // 记录 id 由入口页带过来；没有说明不是从入口进的（直接开 URL），不放行
  const { recordId } = Route.useSearch()
  if (!recordId) {
    return (
      <ExamNotice
        paperId={paperId}
        title="缺少考试记录"
        description="请从考试入口点击「开始考试」进入答题页。"
      />
    )
  }
  return <ExamPaper recordId={recordId} paperId={paperId} />
}
