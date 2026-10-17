import type { ReactNode } from 'react'
import { Badge } from '#/components/ui/badge.tsx'
import {
  AlarmClock,
  GraduationCap,
  ListChecks,
  Target,
  Trophy,
} from 'lucide-react'
import { formatDateTimeShort, formatUsedTime } from '#/lib/date-util.ts'
import { StatChip } from '#/features/exam/taking/components/StatChip.tsx'
import { EXAM_RECORD_STATUS_MAP } from '#/features/console/papers/list/examRecordConstants.ts'
import type {
  ExamRecordDetail,
  ExamRecordListItemRes,
} from '#/__generated/model/static'

interface DetailHeaderProps {
  /** 列表行：及格分 / 排名 / 用时 / 总分只有它有，详情接口不带 */
  record: ExamRecordListItemRes
  /** 详情（可能还没到）：试卷名 / 得分 / 状态优先取它 */
  detail: ExamRecordDetail | undefined
  /** 右侧额外动作（评分弹窗传「提交评卷」按钮，查看弹窗不传） */
  action?: ReactNode
}

/**
 * 弹窗顶栏：左「试卷名 + 考生」，右「状态 + 统计格（+ 可选动作）」。
 *
 * 试卷名 / 得分 / 状态**优先取详情里的值** —— 提交评卷后立刻反映，不必等父列表刷新；
 * 详情还没到就回落列表行。
 */
export function DetailHeader({ record, detail, action }: DetailHeaderProps) {
  const paperName = detail?.paper.name ?? ''
  const score = detail?.score ?? record.score
  const status = detail?.status ?? record.status

  return (
    <header className="bg-background/80 flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{paperName}</div>
          <div className="text-muted-foreground truncate text-xs">
            考生：{record.studentName}
            {` · ${formatDateTimeShort(record.startTime)} ~ ${
              record.endTime ? formatDateTimeShort(record.endTime) : '-'
            }`}
          </div>
        </div>
      </div>

      {/* pr-14 给弹窗右上角自带的关闭按钮让位 */}
      <div className="flex shrink-0 items-center gap-2 pr-14">
        <Badge variant={EXAM_RECORD_STATUS_MAP[status].variant}>
          {EXAM_RECORD_STATUS_MAP[status].label}
        </Badge>
        <StatChip
          icon={<Trophy className="size-4" />}
          label="得分 / 总分"
          value={`${score} / ${record.totalScore}`}
          tone={score >= record.passingScore ? 'success' : 'default'}
        />
        <StatChip
          icon={<Target className="size-4" />}
          label="及格分"
          value={String(record.passingScore)}
        />
        <StatChip
          icon={<ListChecks className="size-4" />}
          label="排名"
          value={String(record.rank)}
        />
        <StatChip
          icon={<AlarmClock className="size-4" />}
          label="用时"
          value={formatUsedTime(record.usedSeconds)}
        />
        {action}
      </div>
    </header>
  )
}
