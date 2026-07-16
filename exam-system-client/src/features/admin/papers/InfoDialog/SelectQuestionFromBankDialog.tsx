import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { toast } from 'sonner'
import { api } from '#/ApiInstance.ts'
import { QUESTION_TYPE_MAP } from '#/features/admin/papers/constants.ts'
import type { QuestionListReq } from '#/__generated/model/static'

interface SelectQuestionFromBankDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paperId: number
  onSuccess: () => void
  existingIds: number[]
}

interface SelectionItem {
  questionId: number
  score: number
}

export default function SelectQuestionFromBankDialog({
  open,
  onOpenChange,
  paperId,
  onSuccess,
  existingIds,
}: SelectQuestionFromBankDialogProps) {
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selections, setSelections] = useState<Record<number, SelectionItem>>(
    {},
  )
  const pageSize = 10

  const filters: QuestionListReq = {
    page,
    size: pageSize,
    keyword: keyword || undefined,
    type: typeFilter || undefined,
  }

  const { data, isFetching } = useQuery({
    queryKey: ['bank-questions', filters],
    queryFn: () =>
      (api as any).questionController.listQuestions({ req: filters }),
    enabled: open,
  })

  const pageData = data?.data
  const records: Array<{
    id: number
    title: string
    type: string
    difficulty: string
  }> = pageData?.records ?? []
  const totalPages = pageData?.pages ?? 1

  const associateMutation = useMutation({
    mutationFn: (items: SelectionItem[]) =>
      (api as any).paperController.addPaperQuestions({
        id: paperId,
        body: { questions: items },
      }),
    onSuccess: () => {
      toast.success(`已添加 ${Object.keys(selections).length} 道题目`)
      onSuccess()
      onOpenChange(false)
      setSelections({})
      setKeyword('')
      setTypeFilter('')
      setPage(1)
    },
    onError: () => toast.error('添加失败'),
  })

  const toggleSelection = (questionId: number) => {
    setSelections((prev) => {
      if (questionId in prev) {
        const next = { ...prev }
        delete next[questionId]
        return next
      }
      return { ...prev, [questionId]: { questionId, score: 5 } }
    })
  }

  const updateScore = (questionId: number, score: number) => {
    setSelections((prev) => {
      if (!(questionId in prev)) return prev
      return { ...prev, [questionId]: { ...prev[questionId], score } }
    })
  }

  const handleSubmit = () => {
    const items = Object.values(selections)
    if (items.length === 0) {
      toast.error('请至少选择一道题目')
      return
    }
    associateMutation.mutate(items)
  }

  const selectedCount = Object.keys(selections).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[800px] max-w-none flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>从题库中选题</DialogTitle>
        </DialogHeader>

        {/* 筛选栏 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="搜索题目..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="w-32">
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="全部题型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部题型</SelectItem>
                <SelectItem value="CHOICE">选择题</SelectItem>
                <SelectItem value="JUDGE">判断题</SelectItem>
                <SelectItem value="TEXT">简答题</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 表格 */}
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="w-12 px-3 py-2">
                  <span className="sr-only">选择</span>
                </th>
                <th className="w-16 px-3 py-2 font-medium">题型</th>
                <th className="px-3 py-2 font-medium">题目内容</th>
                <th className="w-24 px-3 py-2 font-medium">分数</th>
              </tr>
            </thead>
            <tbody>
              {records.map((q) => {
                const isExisting = existingIds.includes(q.id)
                const isSelected = q.id in selections
                const selEntry = selections[q.id]
                const selScore = selEntry.score
                const typeEntry = QUESTION_TYPE_MAP[q.type]
                const typeLabel = typeEntry.label
                return (
                  <tr
                    key={q.id}
                    className={`border-t transition-colors hover:bg-muted/30${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isExisting}
                        onChange={() => toggleSelection(q.id)}
                      />
                    </td>
                    <td className="px-3 py-2">{typeLabel}</td>
                    <td className="max-w-xs truncate px-3 py-2">
                      {q.title}
                      {isExisting && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          (已添加)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={selScore}
                        disabled={isExisting}
                        className="h-8 w-20"
                        onChange={(e) =>
                          updateScore(q.id, Number(e.target.value))
                        }
                      />
                    </td>
                  </tr>
                )
              })}
              {records.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-muted-foreground py-12 text-center"
                  >
                    {isFetching ? '加载中...' : '暂无数据'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 + 底部按钮 */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1 text-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <span className="text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              已选 {selectedCount} 题
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                setSelections({})
                setKeyword('')
                setTypeFilter('')
                setPage(1)
              }}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={selectedCount === 0 || associateMutation.isPending}
            >
              {associateMutation.isPending ? '添加中...' : '确认添加'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
