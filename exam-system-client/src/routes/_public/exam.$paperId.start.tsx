import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  GraduationCap,
  Star,
  Timer,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { formatDateTime } from '#/lib/date-util.ts'
import { cn } from '#/lib/utils.ts'
import {
  examHistoryQueryOptions,
  examPaperInfoQueryOptions,
} from '#/features/exam/examQueries.ts'
import {
  getSavedStudentName,
  saveStudentName,
} from '#/features/exam/entry/studentNameStorage.ts'
import { useStartExamMutation } from '#/features/console/papers/usePaperActions.ts'
import { ExamEntryError } from '#/features/exam/start/ExamEntryError.tsx'
import { InfoTile } from '#/features/exam/start/InfoTile.tsx'
import { PageShell } from '#/features/exam/start/PageShell.tsx'
import {
  resolveExamUserState,
  studentNameSchema,
} from '#/features/exam/start/utils.ts'
import type { ExamUserState } from '#/features/exam/start/utils.ts'
import { toast } from 'sonner'

/**
 * 考试入口页 `/exam/{paperId}`（免登录可访问 —— 发布步骤给出的链接就是它）。
 *
 * 后端 `GET /exams/paper/{id}` 的口径：
 * - 试卷不存在 / 未发布 → 422「考试不存在」
 * - 已发布但过截止时间 → 422「考试已结束」
 * - 未开始 → 照常返回信息，本页提示「未开始」并不放行
 */
export const Route = createFileRoute('/_public/exam/$paperId/start')({
  loader: async ({ context, params }) => {
    const id = Number(params.paperId)
    const info = await context.queryClient.ensureQueryData(
      examPaperInfoQueryOptions(id),
    )
    if (context.user && info.data?.participateMode === 'LOGIN_REQUIRED') {
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
  const { data } = useSuspenseQuery(examPaperInfoQueryOptions(Number(id)))

  // 免登录考试一律让考生填姓名；账号登录考试一律不显示输入框
  const [studentName, setStudentName] = useState('')
  // 姓名校验的即时提示（由 zod 产生），打字即清
  const [nameError, setNameError] = useState('')

  const info = data?.data
  // 时间显示不带年份（formatDateTime 是 YYYY-MM-DD HH:mm，去掉前 5 个字符即可）
  const fmtTime = (v: string) => formatDateTime(v).slice(5)
  const now = Date.now()
  const notStarted = info ? now < new Date(info.start).getTime() : false
  const ended = info ? now > new Date(info.end).getTime() : false
  // 免登录考试：一律显示姓名输入框（是否已登录都一样）
  const needNameInput = !!info && info.participateMode === 'ANONYMOUS'
  const needLogin = !!info && info.participateMode === 'LOGIN_REQUIRED' && !user

  // 只有「账号登录考试 + 已登录」才拿得到「我」的记录（见 loader 里的说明）
  const canCheckHistory = !!user && info?.participateMode === 'LOGIN_REQUIRED'
  const { data: history } = useQuery({
    ...examHistoryQueryOptions,
    enabled: canCheckHistory,
  })
  // 同一张试卷下「我」的记录；查不到时按未考试处理
  const myRecords = (history ?? []).filter((r) => r.paperId === info?.paperId)
  const examState: ExamUserState = info
    ? resolveExamUserState(myRecords, info, now)
    : 'NOT_ATTEMPTED'

  const startExam = useStartExamMutation()

  // 免登录考试：自动填入上次「开始考试」时记住的姓名（考生自己已经打过字就不覆盖）
  useEffect(() => {
    if (needNameInput) {
      setStudentName((prev) => prev || getSavedStudentName())
    }
  }, [needNameInput])

  const handleStart = () => {
    if (!info) return
    if (notStarted) {
      toast.error(`考试还未开始，开考时间：${formatDateTime(info.start)}`)
      return
    }
    if (ended) {
      toast.error('考试已结束')
      return
    }
    if (needLogin) {
      toast.info('该考试需要登录后参加，请先登录')
      return
    }
    // 免登录考试：姓名必填（1~50 个字符），用 zod 校验；过了才记下来，下次自动填入
    let name = ''
    if (needNameInput) {
      const parsed = studentNameSchema.safeParse(studentName)
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? '姓名不合法'
        setNameError(message)
        toast.error(message)
        return
      }
      // 存 trim 后的值
      saveStudentName(parsed.data)
      name = parsed.data
    } else {
      // 账号登录考试：后端一律取账号里的 realName，请求体里的姓名会被忽略。
      // 但生成的类型把 studentName 标成了必填，而空串会被 @Size(min = 1) 拦成 422，
      name = user?.realName ?? ''
    }
    startExam.mutate({ paperId: info.paperId, studentName: name })
  }

  if (!info) {
    return (
      <PageShell>
        <div className="text-muted-foreground text-sm">加载中…</div>
      </PageShell>
    )
  }

  // 主按钮：先看试卷窗口（未开始 / 已结束），再看「我」的状态（未考试 / 考试中 / 考试结束）
  let buttonLabel = '开始考试'
  let buttonClass = ''
  if (notStarted) {
    buttonLabel = '考试未开始'
  } else if (ended || examState === 'FINISHED') {
    buttonLabel = '考试已结束'
  } else if (examState === 'ONGOING') {
    buttonLabel = '继续考试'
    // 考试中 → 警告色（amber），盖掉 Button 默认的 primary 底色
    buttonClass =
      'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500'
  }

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

          {notStarted && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                考试尚未开始，请于 {formatDateTime(info.start)} 后再进入。
              </span>
            </div>
          )}

          {/* 免登录考试 → 一律让考生填姓名（已登录也要填，成绩只记这里填的姓名；
              上次填过的姓名会从 localStorage 自动填入） */}
          {needNameInput && (
            <div className="space-y-2">
              <Label htmlFor="studentName">
                姓名<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="studentName"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value)
                  // 一开始打字就把上一轮的错误提示清掉
                  if (nameError) setNameError('')
                }}
                placeholder="请输入你的姓名"
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'studentName-error' : undefined}
              />
              {nameError && (
                <p id="studentName-error" className="text-destructive text-sm">
                  {nameError}
                </p>
              )}
            </div>
          )}

          {/* 账号登录考试 + 未登录 → 告知前往登录（不显示姓名框） */}
          {needLogin && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-2">
                <div>该考试要求登录后才能参加，请先登录。</div>
              </div>
            </div>
          )}

          <Button
            className={cn('h-11 w-full text-base', buttonClass)}
            onClick={handleStart}
            disabled={
              notStarted ||
              ended ||
              needLogin ||
              examState === 'FINISHED' ||
              startExam.isPending
            }
          >
            {startExam.isPending ? '正在开考…' : buttonLabel}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            点击「开始考试」即视为同意遵守考试纪律，请独立完成作答。
          </p>
        </div>
      </div>
    </PageShell>
  )
}
