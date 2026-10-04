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
import type { PopoverSelectOption } from '#/components/popover-select/PopoverSelect.tsx'
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
import { api } from '#/ApiInstance.ts'
import useDebounce from '#/hooks/useDebounce.ts'
import { formatDateTimeShort } from '#/lib/date-util.ts'
import { cn } from '#/lib/utils.ts'
import { PaperPagination } from './PaperPagination.tsx'
import ExamRecordDetailDialog from './ExamRecordDetailDialog.tsx'
import {
  EXAM_RECORD_STATUS_MAP,
  canViewRecordDetail,
} from './examRecordConstants.ts'
import type { ExamRecordStatus } from '#/__generated/model/enums'
import type { ExamRecordListItemRes } from '#/__generated/model/static'

interface GradeDialogProps {
  paperId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  paperNmae?: string
}

/** 状态筛选项 —— 标签复用共用的状态文案表，避免同一套中文写两遍 */
const STATUS_FILTER_OPTIONS: ReadonlyArray<
  PopoverSelectOption<ExamRecordStatus>
> = [
  { value: 'ONGOING', label: EXAM_RECORD_STATUS_MAP.ONGOING.label },
  { value: 'GRADING', label: EXAM_RECORD_STATUS_MAP.GRADING.label },
  { value: 'GRADED', label: EXAM_RECORD_STATUS_MAP.GRADED.label },
]

/**
 * 「是否及格」筛选的载体值。
 * `PopoverSelect` 的泛型约束是 `T extends string`，而查询参数 `passed` 是 `boolean`
 * —— 所以用 PASS/FAIL 当载体，发请求时再转布尔。
 */
type PassFilter = 'PASS' | 'FAIL'

const PASS_FILTER_OPTIONS: ReadonlyArray<PopoverSelectOption<PassFilter>> = [
  { value: 'FAIL', label: '未及格' },
  { value: 'PASS', label: '及格' },
]

/**
 * 统计卡图标的颜色（浅色 / 深色各一档），纯装饰 —— 按语义给色，
 * 让一排数字有辨识度：人数=蓝、及格=绿、不及格=红、最高分=琥珀、平均分=紫、最低分=青。
 * <p>
 * 图标**不带底色**，色值沿用项目既有惯例（浅色 `-600` / 深色 `-400`）。
 */
const STAT_ICON_TONE = {
  people: 'text-blue-600 dark:text-blue-400',
  pass: 'text-emerald-600 dark:text-emerald-400',
  fail: 'text-rose-600 dark:text-rose-400',
  max: 'text-amber-600 dark:text-amber-400',
  avg: 'text-violet-600 dark:text-violet-400',
  min: 'text-cyan-600 dark:text-cyan-400',
} as const

/**
 * 用时秒数 →「X分Y秒」。
 * 后端对**未交卷**（考试中 / 无交卷时间）的记录直接给 0，这里只需防御性兜底。
 */
function formatUsedTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  return `${Math.floor(safe / 60)}分${safe % 60}秒`
}

/**
 * 列表行「成绩」→ 该试卷全部考试记录的弹窗。
 *
 * 数据源 `GET /exams/records`（控制台侧，后端已做「试卷归属当前用户」校验）：
 * - 排序与名次都由后端定（成绩降序，名次 = 顺序名次），前端**不要重排**；
 * - `rank` 是**当前筛选结果集内**的名次 —— 姓名 / 状态 / 及格任一条件生效后名次都会重新从 1 开始，
 *   这是既定口径（不是全卷名次）；
 * - 分页 / 每页条数 / 三个筛选全部下推给后端（客户端筛会让 total 与名次算错）；
 * - 表格上方的统计来自 `GET /exams/records/stats`，是**整卷**口径（含考试中/待批改），
 *   不受三个筛选影响；平均分由前端保留 1 位小数。
 */
export default function GradeDialog({
  paperId,
  open,
  onOpenChange,
  paperNmae,
}: GradeDialogProps) {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [nameInput, setNameInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExamRecordStatus>()
  const [passFilter, setPassFilter] = useState<PassFilter>()
  // 答题详情（嵌套弹窗）：存**整行数据**，头部直接用（比详情接口多带及格分/排名）
  const [detailRecord, setDetailRecord] =
    useState<ExamRecordListItemRes | null>(null)
  // 打字不立刻打接口：静默 300ms 后才带上姓名条件
  const name = useDebounce(nameInput, 300)

  const {
    data,
    isFetching,
    error,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: [
      'paperExamRecords',
      paperId,
      page,
      size,
      name,
      statusFilter,
      passFilter,
    ],
    queryFn: () =>
      api.examController.listPaperRecords({
        // 空串不传（后端把空白当「不筛」，这里提前收敛成 undefined）
        query: {
          paperId,
          page,
          size,
          name: name.trim() || undefined,
          status: statusFilter,
          passed: passFilter === undefined ? undefined : passFilter === 'PASS',
        },
      }),
    enabled: open,
    // 翻页/改名时保留上一页内容，避免表格闪一下空白
    placeholderData: (prev) => prev,
    staleTime: 10 * 1000,
  })

  const rows = data?.list ?? []
  const total = data?.total ?? rows.length
  const totalPages = Math.max(1, Math.ceil(total / size))

  // 统计是**整卷**口径（不受姓名 / 状态 / 及格筛选影响，也与分页无关），
  // 故单独一个 queryKey，只在打开弹窗时拉一次
  const {
    data: statsData,
    isFetching: isStatsFetching,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['paperExamStats', paperId],
    queryFn: () =>
      api.examController.getExamRecordStats({ query: { paperId } }),
    enabled: open,
    staleTime: 10 * 1000,
  })
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
          <DialogTitle>{paperNmae}</DialogTitle>
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
                <div className="text-muted-foreground text-xs">{item.label}</div>
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

      {/* 嵌套弹窗：单个考生的逐题作答（只读）—— open 由 detailRecord 是否非空决定 */}
      <ExamRecordDetailDialog
        record={detailRecord}
        open={!!detailRecord}
        onOpenChange={(next) => {
          if (!next) setDetailRecord(null)
        }}
      />
    </Dialog>
  )
}
