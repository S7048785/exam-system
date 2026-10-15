import { useState } from 'react'
import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import { formatDateTimeShort } from '#/lib/date-util.ts'
import { cn } from '#/lib/utils.ts'
import ScoreListDialog from '../components/ScoreListDialog'
import type { PaperReportView } from '#/__generated/model/static'

interface Props {
  items: readonly PaperReportView[]
}

/**
 * 时间格式化。
 * <p>
 * ⚠️ 后端的 `start` / `end` 来自 1:1 的 `paper_exam_settings`，建卷时**不预写**设置行，
 * 所以这两列在库里可能是 NULL —— 类型上写着 `string`，运行时却可能是 `undefined`。
 * `formatDateTimeShort()` 遇到空值会直接抛错，因此这里必须先把空值挡掉。
 */
function formatRange(start?: string | null, end?: string | null) {
  return {
    start: start ? formatDateTimeShort(start) : '—',
    end: end ? formatDateTimeShort(end) : '—',
  }
}

/** 计数徽标：0 用低调样式，非 0 才突出（未评用琥珀色，是最需要点进去处理的） */
function CountBadge({
  value,
  tone,
}: {
  value: number
  tone: 'submitted' | 'grading' | 'graded'
}) {
  if (value <= 0) {
    return <span className="text-muted-foreground text-sm">0</span>
  }
  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-medium tabular-nums',
        tone === 'grading' &&
          'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
        tone === 'graded' &&
          'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
      )}
    >
      {value}
    </Badge>
  )
}

/**
 * 「人工判卷」列表：每张卷一行 + 交卷 / 未评 / 已评三个计数。
 *
 * 行操作直接复用试卷列表那套 `ScoreListDialog`（按 `paperId` 拉该卷全部考试记录，
 * 再点开单条记录进 成绩详情/评分弹窗 判卷），所以这里不用重新实现判卷入口。
 */
export function PaperReportTable({ items }: Props) {
  const [gradeTarget, setGradeTarget] = useState<PaperReportView | null>(null)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-50">试卷</TableHead>
            <TableHead>开考时间</TableHead>
            <TableHead>结束时间</TableHead>
            <TableHead className="text-right">满分 / 及格分</TableHead>
            <TableHead className="text-center">交卷</TableHead>
            <TableHead className="text-center">未评</TableHead>
            <TableHead className="text-center">已评</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const range = formatRange(item.start, item.end)
            const needGrading = item.gradingCount > 0
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {range.start}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {range.end}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {item.totalScore}
                  <span className="text-muted-foreground">
                    {' '}
                    / {item.passingScore ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <CountBadge value={item.submittedCount} tone="submitted" />
                </TableCell>
                <TableCell className="text-center">
                  <CountBadge value={item.gradingCount} tone="grading" />
                </TableCell>
                <TableCell className="text-center">
                  <CountBadge value={item.gradedCount} tone="graded" />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={needGrading ? 'default' : 'outline'}
                    onClick={() => setGradeTarget(item)}
                  >
                    {needGrading
                      ? `去判卷（${item.gradingCount}）`
                      : '查看成绩'}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {gradeTarget && (
        <ScoreListDialog
          paperId={gradeTarget.id}
          paperName={gradeTarget.name}
          open
          onOpenChange={(open) => {
            if (!open) setGradeTarget(null)
          }}
        />
      )}
    </div>
  )
}
