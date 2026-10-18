import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ClipboardList, FileText } from 'lucide-react'
import { Badge } from '#/components/ui/badge.tsx'
import { formatDateTimeShort } from '#/lib/date-util.ts'
import { cn } from '#/lib/utils.ts'
import { examHistoryQueryOptions } from '#/features/exam/examQueries.ts'
import { EXAM_RECORD_STATUS_MAP } from '#/features/console/papers/list/examRecordConstants.ts'
import type { ExamHistoryItemRes } from '#/__generated/model/static'

/** `10-16 18:52 ~ 18:52`（同一天就省掉结束那侧的日期）；未交卷显示「未交卷」 */
function formatRange(startTime: string, endTime: string | null) {
  const start = formatDateTimeShort(startTime)
  if (!endTime) return `${start} ~ 未交卷`
  const end = formatDateTimeShort(endTime)
  // MM-DD HH:mm：前 5 位是日期，6 位之后是时间
  return start.slice(0, 5) === end.slice(0, 5)
    ? `${start} ~ ${end.slice(6)}`
    : `${start} ~ ${end}`
}

interface Props {
  /**
   * 结果页传入：确认「正在看的那条」属于当前登录用户。
   * 入口页没有「当前记录」，不传（列表本身就是这个账号自己的记录）。
   */
  currentPublicId?: string
  /** 当前试卷 id：历史只查这张卷（后端按「当前用户 + 这张卷」过滤） */
  paperId: number
  /** 面板没打开时不发请求（历史只在用户点开时才拉） */
  enabled: boolean
  /** 跳转前通知调用方（弹窗要顺手关掉） */
  onNavigate?: () => void
}

/**
 * **本张试卷 + 当前登录考生**的历史成绩列表，只嵌在结果页的「查看历史成绩」弹窗里。
 *
 * 数据源 `GET /exams/history?paperId=`：后端按登录用户查、再按试卷过滤，两个维度都在服务端收口。
 * 结果接口是公开的（拿到 `publicId` 就能看），所以这里再用 `currentPublicId` 确认
 * 正在看的那条**属于当前登录用户** —— 否则打开别人的成绩页会列出「我」在这张卷上的记录，语义就错了。
 *
 * 点一行跳 `/exam/result/{publicId}` —— 但**只有已批改（GRADED）才有结果**：
 * 考试中 / 待批改的记录没有成绩可看，跳过去只会得到一句「试卷未提交」，所以这两类行不可点。
 */
export function ExamHistoryList({
  currentPublicId,
  paperId,
  enabled,
  onNavigate,
}: Props) {
  const navigate = useNavigate()
  const { data, isPending, error } = useQuery({
    ...examHistoryQueryOptions(paperId),
    enabled,
  })

  if (isPending) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">加载中…</p>
    )
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <div className="text-sm font-medium">考试记录加载失败</div>
        <div className="text-muted-foreground mt-1 text-xs">
          {error instanceof Error ? error.message : '请稍后重试'}
        </div>
      </div>
    )
  }

  // isPending 已早返回，这里 data 一定有值（未登录时由调用方不渲染本组件）
  const records = data
  // 结果页会传 currentPublicId：正在看的那条不在「我的本卷记录」里 ⇒ 不是自己的成绩，不列
  const owned =
    currentPublicId === undefined ||
    records.some((record) => record.publicId === currentPublicId)

  if (!owned || records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <ClipboardList className="text-muted-foreground size-10" />
        <div className="text-sm font-medium">这场考试没有你的作答记录</div>
        <div className="text-muted-foreground text-xs">
          列表只显示当前账号在本张试卷上的考试成绩。
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {records[0].paperName} · 共 {records.length} 次作答
        </span>
        <span>点击已批改的记录查看成绩</span>
      </div>

      <ul className="divide-border max-h-[55vh] divide-y overflow-y-auto rounded-lg border">
        {records.map((record) => (
          <ExamHistoryRow
            key={record.publicId}
            record={record}
            onOpen={() => {
              onNavigate?.()
              navigate({
                to: '/exam/result/$publicId',
                params: { publicId: record.publicId },
              })
            }}
          />
        ))}
      </ul>
    </div>
  )
}

function ExamHistoryRow({
  record,
  onOpen,
}: {
  record: ExamHistoryItemRes
  onOpen: () => void
}) {
  const graded = record.status === 'GRADED'
  const status = EXAM_RECORD_STATUS_MAP[record.status]

  return (
    <li>
      <div
        role={graded ? 'button' : undefined}
        tabIndex={graded ? 0 : undefined}
        onClick={graded ? onOpen : undefined}
        onKeyDown={
          graded
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen()
                }
              }
            : undefined
        }
        className={cn(
          'flex items-center gap-3 px-4 py-3.5 transition-colors',
          graded
            ? 'hover:bg-muted/60 focus-visible:bg-muted/60 cursor-pointer outline-none'
            : 'cursor-default',
        )}
      >
        <div className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
          <FileText className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{record.paperName}</div>
          <div className="text-muted-foreground mt-0.5 text-xs tabular-nums">
            {formatRange(record.startTime, record.endTime)}
          </div>
        </div>

        {graded ? (
          <div className="flex items-baseline gap-1">
            <span className="text-primary text-lg leading-none font-semibold tabular-nums">
              {record.score ?? 0}
            </span>
            <span className="text-muted-foreground text-xs">分</span>
          </div>
        ) : (
          <Badge variant={status.variant}>{status.label}</Badge>
        )}

        <ChevronRight
          className={cn(
            'size-4 shrink-0',
            graded ? 'text-muted-foreground' : 'text-transparent',
          )}
        />
      </div>
    </li>
  )
}
