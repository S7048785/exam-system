import React, { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
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
import { Avatar, AvatarFallback } from '#/components/ui/avatar.tsx'
import { formatDateTime } from '#/lib/date-util.ts'
import { examPaperInfoQueryOptions } from '#/features/exam/entry/examQueries.ts'
import {
  getSavedStudentName,
  saveStudentName,
} from '#/features/exam/entry/studentNameStorage.ts'
import { toast } from 'sonner'
import z from 'zod'

/**
 * 考试入口页 `/exam/{paperId}`（免登录可访问 —— 发布步骤给出的链接就是它）。
 *
 * 后端 `GET /exams/paper/{id}` 的口径：
 * - 试卷不存在 / 未发布 → 422「考试不存在」
 * - 已发布但过截止时间 → 422「考试已结束」
 * - 未开始 → 照常返回信息，本页提示「未开始」并不放行
 *
 * 数据请求：`loader` 里 `ensureQueryData` 预取（请求只发一次），组件里的 `useQuery`
 * 直接吃缓存；失败时走本路由的 `errorComponent`（不再各自渲染错误块）。
 */
export const Route = createFileRoute('/_public/exam/$paperId')({
  loader: ({ context, params }) => {
    const id = Number(params.paperId)
    return context.queryClient.ensureQueryData(examPaperInfoQueryOptions(id))
  },
  // params: {
  //   parse: (rawParams) => {
  //     const id = Number(rawParams.paperId)
  //     if (isNaN(id)) throw notFound()
  //     return { paperId: id }  // 转为 number
  //   },
  //   stringify: (params) => ({
  //     paperId: String(params.paperId),
  //   }),
  // },
  component: ExamEntryPage,
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="space-y-3 rounded-lg border p-8 text-center">
        <TriangleAlert className="text-destructive mx-auto size-10" />
        <div className="text-lg font-semibold">无法参加该考试</div>
        <div className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : '考试不存在'}
        </div>
        <div className="text-muted-foreground text-xs">
          请确认链接是否正确，或联系监考老师获取新的考试链接。
        </div>
      </div>
    </PageShell>
  ),
})

/**
 * 页面骨架：顶部导航栏（左 logo + 站名，右 用户名 + 头像）+ 居中内容区。
 *
 * 登录态取自**路由上下文**（`__root.tsx` 的 `beforeLoad` 里用 `createServerFn` 带着 cookie
 * 拉到的用户信息），不再读 zustand —— 那份是 localStorage 里的客户端副本，SSR 阶段拿不到，
 * 会出现「服务端按未登录渲染、客户端接管后突然变成已登录」的跳变。
 */
function PageShell({ children }: { children: React.ReactNode }) {
  const { user } = Route.useRouteContext()
  const isLoggedIn = !!user

  return (
    <div className="from-primary/10 via-background to-background flex min-h-screen flex-col bg-linear-to-br">
      {/* 导航栏 */}
      <header className="bg-background/80 flex items-center justify-between border-b px-6 py-3 backdrop-blur">
        {/* 左侧：logo + 网站名 */}
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/favicon.ico"
            alt="logo"
            className="size-8 rounded-md"
          />
          <span className="text-base font-semibold">在线考试系统</span>
        </Link>

        {/* 右侧：用户名 + 头像（NavUser 同款 Avatar） */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium">{user!.realName}</span>
            <Avatar className="size-8 rounded-lg">
              {/* 后端 USER_INFO 只返回 id / email / realName / role，没有 avatar，
                  所以这里不挂 AvatarImage，直接显示姓名首字 */}
              <AvatarFallback className="rounded-lg">
                {user!.realName.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link to="/login">登录</Link>
          </Button>
        )}
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}

type InfoTileType = {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}
function InfoTile({
  icon,
  label,
  value,
}: InfoTileType) {
  return (
    <div className="bg-muted/50 flex items-start gap-3 rounded-lg px-3 py-2.5">
      <div className="text-primary mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}

/**
 * 考生姓名校验（免登录考试专用），口径与后端 `StartExamReq.studentName` 的
 * `@Size(min = 1, max = 50)` 对齐：必填、最多 50 个字符（对齐 `student_name varchar(50)`）。
 * `trim()` 顺带把首尾空格去掉，落库/记 localStorage 的都是清理过的值。
 */
const studentNameSchema = z
  .string()
  .trim()
  .min(1, '请输入姓名')
  .max(50, '姓名不能超过 50 个字符')

function ExamEntryPage() {
  const {paperId: id} = Route.useParams()
  const user = Route.useRouteContext().user
  // loader 已 ensureQueryData，这里直接命中缓存
  const {data} = useSuspenseQuery(examPaperInfoQueryOptions(Number(id)))

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
  const needLogin =
    !!info && info.participateMode === 'LOGIN_REQUIRED' && !user

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
    // 姓名用 zod 校验（必填 + 最长 50 个字符）：失败时 toast + 输入框下方提示
    if (needNameInput) {
      const parsed = studentNameSchema.safeParse(studentName)
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? '姓名不合法'
        setNameError(message)
        toast.error(message)
        return
      }
      // 校验过了才记姓名，下次进免登录考试自动填入（存 trim 后的值）
      saveStudentName(parsed.data)
    }
    if (needLogin) {
      toast.info('该考试需要登录后参加，请先登录')
      return
    }
    toast.info('开始考试的接口下一步接入')
  }

  if (!info) {
    return (
      <PageShell>
        <div className="text-muted-foreground text-sm">加载中…</div>
      </PageShell>
    )
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
            className="h-11 w-full text-base"
            onClick={handleStart}
            disabled={notStarted || ended || needLogin}
          >
            {notStarted ? '考试未开始' : ended ? '考试已结束' : '开始考试'}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            点击「开始考试」即视为同意遵守考试纪律，请独立完成作答。
          </p>
        </div>
      </div>
    </PageShell>
  )
}
