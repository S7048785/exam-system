import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { CalendarDays, GraduationCap, Star, Timer } from 'lucide-react'
import { formatDateTime } from '#/lib/date-util.ts'
import {
  examHistoryQueryOptions,
  examPaperInfoQueryOptions,
} from '#/features/exam/examQueries.ts'
import { useStartExamMutation } from '#/features/console/papers/usePaperActions.ts'
import { AccountEntry } from '#/features/exam/start/AccountEntry.tsx'
import { AnonymousEntry } from '#/features/exam/start/AnonymousEntry.tsx'
import { EntryNotice } from '#/features/exam/start/EntryNotice.tsx'
import { ExamEntryError } from '#/features/exam/start/ExamEntryError.tsx'
import { InfoTile } from '#/features/exam/start/InfoTile.tsx'
import { PageShell } from '#/features/exam/start/PageShell.tsx'
import { useNow } from '#/features/exam/start/useNow.ts'
import {
  resolveEntryPhase,
  resolveWindowPhase,
} from '#/features/exam/start/utils.ts'

/**
 * 考试入口页 `/exam/{paperId}`（免登录可访问 —— 发布步骤给出的链接就是它）。
 *
 * 后端 `GET /exams/paper/{id}` 的口径：
 * - 试卷不存在 / 未发布 → 422「考试不存在」
 * - 已发布但过截止时间 → 422「考试已结束」
 * - 未开始 → 照常返回信息，本页提示「未开始」并不放行
 *
 * 本文件只做三件事：**取数 → 选分支 → 摆壳**。两条参与模式各自的
 */
export const Route = createFileRoute('/_public/exam/$paperId/start')({
  // 考生入口页不走 SSR：页面内容完全取决「现在几点」和「本地是否存过姓名」，
  // 服务端渲染只会多一层时间基准不一致的风险
  ssr: false,
  loader: async ({ context, params }) => {
    const id = Number(params.paperId)
    const info = await context.queryClient.ensureQueryData(
      examPaperInfoQueryOptions(id),
    )
    if (context.user && info.data.participateMode === 'LOGIN_REQUIRED') {
      await context.queryClient.prefetchQuery(examHistoryQueryOptions)
    }
    return info
  },
  component: ExamEntryPage,
  errorComponent: ExamEntryError,
})

function ExamEntryPage() {
  const { paperId: id } = Route.useParams()
  const user = Route.useRouteContext().user
  // loader 已 ensureQueryData，这里直接命中缓存
  const { data: info } = useSuspenseQuery(examPaperInfoQueryOptions(Number(id)))

  const isAnonymous = info.participateMode === 'ANONYMOUS'

  // 免登录模式拿不到「我」的记录（`examHistory` 要求登录）⇒ 不查，也就判不了续考
  const { data: history } = useQuery({
    ...examHistoryQueryOptions,
    enabled: !isAnonymous && !!user,
  })
  const myRecords = (history ?? []).filter((r) => r.paperId === info.paperId)

  // 会自己走的「现在」：跨过试卷 start / end、或续考的作答时限就重算
  const now = useNow([
    new Date(info.start).getTime(),
    new Date(info.end).getTime(),
    ...myRecords
      .filter((r) => r.status === 'ONGOING')
      .map(
        (r) => new Date(r.startTime ?? 0).getTime() + info.duration * 60_000,
      ),
  ])

  const startExam = useStartExamMutation()
  const submit = (studentName: string) =>
    startExam.mutate({ paperId: info.paperId, studentName })

  const window = resolveWindowPhase(info, now)
  // 时间显示不带年份（formatDateTime 是 YYYY-MM-DD HH:mm，去掉前 5 个字符即可）
  const fmtTime = (v: string) => formatDateTime(v).slice(5)

  return (
    <PageShell>
      <div className="bg-card w-full max-w-xl space-y-6 shadow-xl">
        {/* 顶部横幅 */}
        <div className="from-primary to-primary/70 relative space-y-1.5 bg-linear-to-r px-6 py-6 text-white">
          <GraduationCap className="absolute top-4 right-5 size-16 opacity-15" />
          <div className="text-xs font-medium tracking-widest uppercase opacity-80">
            在线考试
          </div>
          <h1 className="text-2xl leading-tight font-bold">{info.name}</h1>
          {info.description && (
            <p className="text-sm whitespace-pre-wrap opacity-85">
              {info.description}
            </p>
          )}
        </div>

        <div className="space-y-6 px-6 pb-6">
          {/* 信息块 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <InfoTile
                icon={<CalendarDays className="size-4" />}
                label="考试时间"
                value={`${fmtTime(info.start)} - ${fmtTime(info.end)}`}
              />
            </div>
            <InfoTile
              icon={<Timer className="size-4" />}
              label="考试时长"
              value={`${info.duration} 分钟`}
            />
            <InfoTile
              icon={<Star className="size-4" />}
              label="总分"
              value={`${info.totalScore} 分`}
            />
          </div>

          {window === 'NOT_STARTED' && (
            <EntryNotice>
              考试尚未开始，请于 {formatDateTime(info.start)} 后再进入。
            </EntryNotice>
          )}

          {isAnonymous ? (
            <AnonymousEntry
              window={window}
              submitting={startExam.isPending}
              onStart={submit}
            />
          ) : (
            <AccountEntry
              phase={resolveEntryPhase(info, !!user, myRecords, now)}
              submitting={startExam.isPending}
              realName={user?.realName}
              onStart={submit}
            />
          )}

          <p className="text-muted-foreground text-center text-xs">
            点击「开始考试」即视为同意遵守考试纪律，请独立完成作答。
          </p>
        </div>
      </div>
    </PageShell>
  )
}
