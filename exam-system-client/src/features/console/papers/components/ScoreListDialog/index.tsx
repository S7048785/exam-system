import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import PopoverSelect from '#/components/popover-select/PopoverSelect.tsx'
import {
  Activity,
  CircleCheck,
  CircleX,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import useDebounce from '#/hooks/useDebounce.ts'
import { formatDateTimeShort, formatUsedTime } from '#/lib/date-util.ts'
import { cn } from '#/lib/utils.ts'
import {
  paperExamRecordsQueryOptions,
  paperExamStatsQueryOptions,
} from '#/features/console/papers/paperQueries.ts'
import { PaperPagination } from '#/features/console/papers/list/PaperPagination.tsx'
import ScoreDetailDialog from '../ScoreDialog/ScoreDetailDialog'
import ScoreGradingDialog from '../ScoreDialog/ScoreGradingDialog'
import {
  EXAM_RECORD_STATUS_MAP,
  canViewRecordDetail,
} from '#/features/console/papers/list/examRecordConstants.ts'
import type { ExamRecordStatus } from '#/__generated/model/enums'
import type { ExamRecordListItemRes } from '#/__generated/model/static'

import {
  PASS_FILTER_OPTIONS,
  STAT_ICON_TONE,
  STATUS_FILTER_OPTIONS,
} from './constants.ts'
import type { PassFilter } from './constants.ts'

interface ScoreListDialogProps {
  paperId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  paperName?: string
}

/**
 * 列表行「成绩」→ 该试卷全部考试记录的弹窗。
 */
export default function ScoreListDialog({
  paperId,
  open,
  onOpenChange,
  paperName,
}: ScoreListDialogProps) {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [nameInput, setNameInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExamRecordStatus>()
  const [passFilter, setPassFilter] = useState<PassFilter>()
  // 嵌套弹窗：查看成绩 / 考试评分（两个独立弹窗，共用 ScoreDialogShell）
  const [detailRecord, setDetailRecord] =
    useState<ExamRecordListItemRes | null>(null)
  const [gradeRecord, setGradeRecord] = useState<ExamRecordListItemRes | null>(
    null,
  )
  // 打字不立刻打接口：静默 300ms 后才带上姓名条件
  const name = useDebounce(nameInput, 300)

  const {
    data,
    isFetching,
    error,
    refetch: refetchRecords,
  } = useQuery(
    paperExamRecordsQueryOptions(
      {
        paperId,
        page,
        size,
        // 空串不传（后端把空白当「不筛」，这里提前收敛成 undefined）
        name: name.trim() || undefined,
        status: statusFilter,
        passed: passFilter === undefined ? undefined : passFilter === 'PASS',
      },
      open,
    ),
  )

  const rows = data?.list ?? []
  const total = data?.total ?? rows.length
  const totalPages = Math.max(1, Math.ceil(total / size))

  // 统计是**整卷**口径（不受姓名 / 状态 / 及格筛选影响，也与分页无关），
  // 故单独一个 queryKey，只在打开弹窗时拉一次
  const {
    data: statsData,
    isFetching: isStatsFetching,
    refetch: refetchStats,
  } = useQuery(paperExamStatsQueryOptions(paperId, open))
  const stats = statsData?.data

  /** 刷新：表格与统计是两个独立请求，一起重拉 */
  const refresh = () => Promise.all([refetchRecords(), refetchStats()])
  const refreshing = isFetching || isStatsFetching

  const statItems = [
    {
      label: '参与人数',
      value: stats?.participantCount,
      icon: Users,
      tone: STAT_ICON_TONE.people,
    },
    {
      label: '及格次数',
      value: stats?.passCount,
      icon: CircleCheck,
      tone: STAT_ICON_TONE.pass,
    },
    {
      label: '不及格次数',
      value: stats?.failCount,
      icon: CircleX,
      tone: STAT_ICON_TONE.fail,
    },
    {
      label: '最高分',
      value: stats?.maxScore,
      icon: TrendingUp,
      tone: STAT_ICON_TONE.max,
    },
    {
      label: '平均分',
      // 后端给的是原始平均值，这里统一保留 1 位小数
      value: stats ? stats.avgScore.toFixed(1) : undefined,
      icon: Activity,
      tone: STAT_ICON_TONE.avg,
    },
    {
      label: '最低分',
      value: stats?.minScore,
      icon: TrendingDown,
      tone: STAT_ICON_TONE.min,
    },
  ]

  const emptyText = error
    ? error instanceof Error
      ? error.message
      : '加载失败'
    : isFetching
      ? '加载中…'
      : '暂无考试记录'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[96%] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{paperName}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          查看该试卷下全部考生的考试记录
        </DialogDescription>
        <div className="space-y-4">
          {/* 整卷统计：不受姓名搜索影响，始终是这张卷的全部记录 */}
          <div className="grid shrink-0 grid-cols-3 gap-3 sm:grid-cols-6">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 border p-3"
              >
                <item.icon className={cn('size-5', item.tone)} />
                <div className="text-muted-foreground text-xs">
                  {item.label}
                </div>
                <div className="text-lg font-semibold">{item.value ?? '-'}</div>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <PopoverSelect
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(next) => {
                setStatusFilter(next)
                setPage(1)
              }}
              placeholder="全部状态"
              className="w-42"
            />
            <PopoverSelect
              options={PASS_FILTER_OPTIONS}
              value={passFilter}
              onChange={(next) => {
                setPassFilter(next)
                setPage(1)
              }}
              placeholder="全部成绩"
              className="w-42"
            />
            <Input
              placeholder="按姓名搜索…"
              value={nameInput}
              // 条件变了要回到第 1 页，否则可能停在一个越界的页码上
              onChange={(e) => {
                setNameInput(e.target.value)
                setPage(1)
              }}
              className="w-60"
            />

            <Button
              variant="outline"
              size="icon-sm"
              title="刷新"
              onClick={() => void refresh()}
              disabled={refreshing}
            >
              <RefreshCw
                className={cn('size-4', refreshing && 'animate-spin')}
              />
            </Button>
          </div>

          <div className="flex-1 overflow-auto border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>开始时间 / 交卷时间</TableHead>
                  <TableHead>用时</TableHead>
                  <TableHead>总分 / 及格分</TableHead>
                  <TableHead>成绩</TableHead>
                  <TableHead>排名</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground h-24 text-center"
                    >
                      {emptyText}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const status = EXAM_RECORD_STATUS_MAP[row.status]
                    const canView = canViewRecordDetail(row.status)
                    // 未交卷（考试中）时 endTime 为 null，用 '-' 占位
                    const start = row.startTime
                      ? formatDateTimeShort(row.startTime)
                      : '-'
                    const end = row.endTime
                      ? formatDateTimeShort(row.endTime)
                      : '-'
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.studentName}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {start}
                          {' ~ '}
                          {end}
                        </TableCell>
                        <TableCell>{formatUsedTime(row.usedSeconds)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.totalScore}/{row.passingScore}
                        </TableCell>
                        <TableCell>{row.score}</TableCell>
                        <TableCell>{row.rank}</TableCell>
                        <TableCell>
                          <Badge variant={status?.variant ?? 'outline'}>
                            {status?.label ?? row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="xs"
                            // 考试中的记录后端也拦（与考生侧口径一致），按钮同步置灰
                            disabled={!canView}
                            title={
                              canView
                                ? '查看答题详情'
                                : '考试中，暂不能查看答题详情'
                            }
                            onClick={() => setDetailRecord(row)}
                          >
                            查看
                          </Button>
                          <Button
                            size="xs"
                            className="ml-2"
                            // 与「查看」同一道门槛：考试中的记录后端也拦（还没交卷不给判）
                            disabled={!canView}
                            title={canView ? '去评卷' : '考试中，暂不能评卷'}
                            onClick={() => setGradeRecord(row)}
                          >
                            去评卷
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <PaperPagination
            total={total}
            page={page}
            totalPages={totalPages}
            size={size}
            onPageChange={setPage}
            onSizeChange={(next) => {
              setSize(next)
              setPage(1)
            }}
          />
        </div>
      </DialogContent>

      {/* 嵌套弹窗：查看成绩（只读）/ 考试评分（可改分）——两个独立弹窗共用一套壳 */}
      <ScoreDetailDialog
        record={detailRecord}
        open={!!detailRecord}
        onOpenChange={(next) => {
          if (!next) setDetailRecord(null)
        }}
      />
      <ScoreGradingDialog
        record={gradeRecord}
        open={!!gradeRecord}
        onOpenChange={(next) => {
          if (!next) setGradeRecord(null)
        }}
      />
    </Dialog>
  )
}
