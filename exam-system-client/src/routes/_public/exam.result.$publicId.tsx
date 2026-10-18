import type { ErrorComponentProps } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { CalendarClock, Timer, Target, TriangleAlert } from 'lucide-react'
import { formatDateTime, formatUsedTime } from '#/lib/date-util.ts'
import { examResultQueryOptions } from '#/features/exam/examQueries.ts'
import { PageShell } from '#/features/exam/start/PageShell.tsx'
import { InfoTile } from '#/features/exam/start/InfoTile.tsx'

/**
 * 考试结果页 `/exam/result/{publicId}`（**免登录**，凭考试记录短码可查）。
 *
 * 后端 `GET /exams/result/{publicId}` 的口径：
 * - 只有 `GRADED` 才返回成绩；`ONGOING` / `GRADING` → 422「试卷未提交」
 * - `publicId` 查不到 → 422「考试记录不存在」
 * 两种 422 都走 `errorComponent`，直接把后端文案展示给考生。
 *
 * 不走 SSR：页面内容完全取决于这条记录的批改状态，服务端渲染没有收益。
 */
export const Route = createFileRoute('/_public/exam/result/$publicId')({
  ssr: false,
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      examResultQueryOptions(params.publicId),
    ),
  component: ExamResultPage,
  errorComponent: ExamResultError,
})

function ExamResultPage() {
  const { publicId } = Route.useParams()
  // loader 已 ensureQueryData，这里直接命中缓存
  const { data: result } = useSuspenseQuery(examResultQueryOptions(publicId))

  return (
    <PageShell>
      <div className="bg-card w-full max-w-xl space-y-6 shadow-xl">
        {/* 顶部横幅：试卷名 + 「考试结果」 */}
        <div className="from-primary to-primary/70 relative space-y-1.5 bg-linear-to-r px-6 py-6 text-white">
          <Target className="absolute top-4 right-5 size-16 opacity-15" />
          <div className="text-xs font-medium tracking-widest uppercase opacity-80">
            考试结果
          </div>
          <h1 className="text-2xl leading-tight font-bold">
            {result.paperName}
          </h1>
        </div>

        <div className="space-y-6 px-6 pb-6">
          {/* 成绩 */}
          <div className="bg-muted/50 flex items-baseline justify-center gap-2 rounded-xl py-6">
            <span className="text-primary text-5xl leading-none font-bold tabular-nums">
              {result.score}
            </span>
            <span className="text-muted-foreground text-sm">
              / {result.totalScore} 分
            </span>
          </div>

          {/* 用时 / 交卷时间 / 及格分 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <InfoTile
                icon={<CalendarClock className="size-4" />}
                label="交卷时间"
                value={formatDateTime(result.endTime)}
              />
            </div>
            <InfoTile
              icon={<Timer className="size-4" />}
              label="用时"
              value={formatUsedTime(result.usedSeconds)}
            />
            <InfoTile
              icon={<Target className="size-4" />}
              label="及格分"
              value={`${result.passingScore} 分`}
            />
          </div>

          <p className="text-muted-foreground text-center text-xs">
            成绩以最终批改结果为准，如需查看作答详情请联系监考老师。
          </p>
        </div>
      </div>
    </PageShell>
  )
}

/** 结果取不到时的兜底页（未交卷 / 待批改 → 试卷未提交；短码不存在 → 考试记录不存在） */
function ExamResultError({ error }: ErrorComponentProps) {
  return (
    <PageShell>
      <div className="space-y-3 rounded-lg border p-8 text-center">
        <TriangleAlert className="text-destructive mx-auto size-10" />
        <div className="text-lg font-semibold">暂无考试结果</div>
        <div className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : '试卷未提交'}
        </div>
        <div className="text-muted-foreground text-xs">
          请确认链接是否正确；若刚交卷且卷中有主观题，需等老师批改后再查看。
        </div>
      </div>
    </PageShell>
  )
}
