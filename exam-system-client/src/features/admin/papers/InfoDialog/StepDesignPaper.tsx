import { memo, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '#/ApiInstance.ts'
import { cn } from '#/lib/utils.ts'
import { QUESTION_TYPE_MAP } from '#/features/admin/papers/constants.ts'
import CreateQuestionInPaperDialog from './CreateQuestionInPaperDialog.tsx'
import SelectQuestionFromBankDialog from './SelectQuestionFromBankDialog.tsx'
import type { PaperDetail_TargetOf_questions } from '#/__generated/model/static'

interface StepDesignPaperProps {
  paperId: number
}

const getTypeLabel = (type: string) => {
  const entry = QUESTION_TYPE_MAP[type]
  return entry.label
}

const renderAnswer = (q: PaperDetail_TargetOf_questions) => {
  if (q.type === 'CHOICE') {
    const correct = q.choices.filter((c) => c.correct)
    if (correct.length > 0) {
      return String(
        correct
          .map((c) => String.fromCharCode(q.choices.indexOf(c) + 65))
          .join(', '),
      )
    }
    return q.answer
  }
  if (q.type === 'JUDGE') {
    return q.answer === 'true' || q.answer === 'T' ? '对' : '错'
  }
  return q.answer
}

interface MemoTableProps {
  questions: readonly PaperDetail_TargetOf_questions[]
  activeIndex: number | undefined
  rowRefs: React.MutableRefObject<(HTMLTableRowElement | null)[]>
  onScoreBlur: (id: number, score: string) => void
  onDelete: (id: number) => void
}

const MemoTable = memo(function ({
  questions,
  activeIndex,
  rowRefs,
  onScoreBlur,
  onDelete,
}: MemoTableProps) {
  const columnHelper = createColumnHelper<PaperDetail_TargetOf_questions>()

  const columns = [
    columnHelper.display({
      id: 'index',
      header: '序号',
      cell: ({ row }) => row.index + 1,
      size: 56,
    }),
    columnHelper.accessor('type', {
      header: '题型',
      cell: ({ getValue }) => getTypeLabel(getValue()),
      size: 80,
    }),
    columnHelper.accessor('title', {
      header: '试题内容',
      cell: ({ getValue }) => (
        <span className="block max-w-xs truncate">{getValue()}</span>
      ),
    }),
    columnHelper.display({
      id: 'answer',
      header: '标准答案',
      cell: ({ row }) => (
        <div className="w-[112px] truncate">{renderAnswer(row.original)}</div>
      ),
      size: 112,
    }),
    columnHelper.accessor('score', {
      header: '分数',
      cell: ({ row, getValue }) => (
        <Input
          type="number"
          min={0}
          defaultValue={getValue()}
          className="h-8 w-20"
          onBlur={(e) => onScoreBlur(row.original.id, e.target.value)}
        />
      ),
      size: 96,
    }),
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive h-7 px-1"
          onClick={() => onDelete(row.original.id)}
        >
          删除
        </Button>
      ),
      size: 64,
    }),
  ]

  const data = useMemo(() => [...questions], [questions])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-muted sticky top-0">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="px-3 py-2 font-medium"
                style={{ width: header.getSize() }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            ref={(el) => {
              rowRefs.current[row.index] = el
            }}
            className={cn(
              'border-t transition-colors',
              activeIndex === row.index ? 'bg-primary/5' : 'hover:bg-muted/30',
            )}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-3 py-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
        {table.getRowModel().rows.length === 0 && (
          <tr>
            <td colSpan={6} className="text-muted-foreground py-12 text-center">
              暂未添加题目，请点击下方按钮添加
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
})

export default function StepDesignPaper({ paperId }: StepDesignPaperProps) {
  const [createConfig, setCreateConfig] = useState<{
    type: 'CHOICE' | 'JUDGE' | 'TEXT'
  } | null>(null)
  const [showBankDialog, setShowBankDialog] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | undefined>()
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  const { data: questionsData, refetch: refetchQuestions } = useQuery({
    queryKey: ['paper-questions', paperId],
    queryFn: () => api.paperController.getPaperQuestions({ id: paperId }),
    select: (d) => d.data,
  })
  const questions = questionsData ?? []
  const totalCount = questions.length
  const totalScore = questions.reduce((s, q) => s + q.score, 0)

  const removeQuestionMutation = useMutation({
    mutationFn: (questionId: number) =>
      api.paperController.removePaperQuestion({
        id: paperId,
        questionId,
      }),
    onSuccess: async () => {
      await refetchQuestions()
      toast.success('题目已移除')
    },
    onError: () => toast.error('移除失败'),
  })

  const updateScoreMutation = useMutation({
    mutationFn: ({
      questionId,
      score,
    }: {
      questionId: number
      score: number
    }) =>
      api.paperController.updatePaperQuestionScore({
        id: paperId,
        questionId,
        score,
      }),
    onSuccess: () => refetchQuestions(),
  })

  const handleUpdateScore = (id: number, score: string) => {
    const newScore = Number(score)
    if (Number.isNaN(newScore) || newScore < 0) return
    updateScoreMutation.mutate({ questionId: id, score: newScore })
  }

  const handleDeleteQuestion = (id: number) => {
    removeQuestionMutation.mutate(id)
  }

  const scrollToQuestion = (index: number) => {
    setActiveIndex(index)
    const row = rowRefs.current[index]
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="h-full">
      <div className="flex h-full gap-4">
        {/* 左侧：总览 + 题号列表 */}
        <div className="bg-popover flex flex-1 shrink-0 flex-col rounded-lg">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="text-muted-foreground text-xs">总计</div>
            <div className="text-lg font-semibold">
              {totalCount}
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                题
              </span>
            </div>
            <div className="text-lg font-semibold">
              {totalScore}
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                分
              </span>
            </div>
          </div>
          <div className="overflow-y-auto p-3">
            {totalCount === 0 ? (
              <p className="text-muted-foreground pt-8 text-center text-sm">
                暂无题目
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => scrollToQuestion(i)}
                    className={cn(
                      'flex size-12 items-center justify-center rounded text-sm font-medium transition-colors',
                      activeIndex === i
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted-foreground/20',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：题目表格 + 按钮组 */}
        <div className="bg-popover flex min-w-0 flex-4 flex-col rounded-lg">
          <div className="min-h-0 flex-1 overflow-auto">
            <MemoTable
              questions={questions}
              activeIndex={activeIndex}
              rowRefs={rowRefs}
              onScoreBlur={handleUpdateScore}
              onDelete={handleDeleteQuestion}
            />
          </div>

          {/* 按钮组 — shrink-0 不随表格滚动 */}
          <div className="flex shrink-0 items-center justify-between border-t px-4 py-3">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    新增试题
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => setCreateConfig({ type: 'CHOICE' })}
                  >
                    选择题
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCreateConfig({ type: 'JUDGE' })}
                  >
                    判断题
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCreateConfig({ type: 'TEXT' })}
                  >
                    简答题
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBankDialog(true)}
              >
                从题库中选题
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 子 Dialog */}
      {createConfig && (
        <CreateQuestionInPaperDialog
          open={!!createConfig}
          onOpenChange={(v) => {
            if (!v) setCreateConfig(null)
          }}
          paperId={paperId}
          onSuccess={refetchQuestions}
          questionType={createConfig.type}
        />
      )}
      <SelectQuestionFromBankDialog
        open={showBankDialog}
        onOpenChange={setShowBankDialog}
        paperId={paperId}
        onSuccess={refetchQuestions}
        existingIds={questions.map((q) => q.id)}
      />
    </div>
  )
}
