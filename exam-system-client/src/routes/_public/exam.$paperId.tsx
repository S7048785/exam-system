import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  CalendarClock,
  GraduationCap,
  Star,
  Timer,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '#/components/ui/avatar.tsx'
import { api } from '#/ApiInstance.ts'
import { formatDateTime } from '#/lib/date-util.ts'
import useUserStore from '#/stores/user.ts'
import { examPaperInfoQueryOptions } from '#/features/exam/entry/examQueries.ts'
import { toast } from 'sonner'

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

/** 页面骨架：顶部导航栏（左 logo + 站名，右 用户名 + 头像）+ 居中内容区 */
function PageShell({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user)
  const isLoggedIn = !!user

  return (
    <div className="from-primary/10 via-background to-background flex min-h-screen flex-col bg-gradient-to-br">
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
              <AvatarImage src={user!.avatar} alt={user!.realName} />
              <AvatarFallback className="rounded-lg">
                {(user!.realName ?? '?').slice(0, 1)}
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

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
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

function ExamEntryPage() {
  const { paperId } = Route.useParams()
  const id = Number(paperId)

  // loader 已 ensureQueryData，这里直接命中缓存
  const { data } = useQuery({
    ...examPaperInfoQueryOptions(id),
    enabled: Number.isFinite(id),
  })

  // 免登录考试才可能让考生填姓名；账号登录考试一律不显示输入框
  const [studentName, setStudentName] = useState('')
  // 登录态：免登录考试下「已登录」就不需要填姓名；账号登录考试下「未登录」要提示去登录
  const isLoggedIn = !!useUserStore((s) => s.user)

  const info = data?.data
  // 时间显示不带年份（formatDateTime 是 YYYY-MM-DD HH:mm，去掉前 5 个字符即可）
  const fmtTime = (v: string) => formatDateTime(v).slice(5)
  const now = Date.now()
  const notStarted = info ? now < new Date(info.start).getTime() : false
  const ended = info ? now > new Date(info.end).getTime() : false
  const needNameInput =
    !!info && info.participateMode === 'ANONYMOUS' && !isLoggedIn
  const needLogin =
    !!info && info.participateMode === 'LOGIN_REQUIRED' && !isLoggedIn

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
    if (needNameInput && !studentName.trim()) {
      toast.error('请输入姓名')
      return
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
        <div className="from-primary to-primary/70 relative space-y-1.5 bg-gradient-to-r px-6 py-6 text-white">
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

          {/* 免登录考试 + 未登录 → 让考生填姓名；已登录则不显示（直接用账号信息） */}
          {needNameInput && (
            <div className="space-y-2">
              <Label htmlFor="studentName">
                姓名<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="请输入你的姓名"
              />
            </div>
          )}

          {/* 账号登录考试 + 未登录 → 告知前往登录（不显示姓名框） */}
          {needLogin && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-2">
                <div>该考试要求登录后才能参加，请先登录。</div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/login">前往登录</Link>
                </Button>
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
