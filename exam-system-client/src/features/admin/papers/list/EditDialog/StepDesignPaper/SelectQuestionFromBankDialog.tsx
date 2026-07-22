import { useState } from 'react'
import { useImmer } from 'use-immer'
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
import useDebounce from '#/hooks/useDebounce.ts'
import type { QuestionType } from '#/types/questoin.ts'

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
  const [selections, updateSelections] = useImmer<
    Record<number, SelectionItem>
  >({})

  const [filter, setFilter] = useState<{
    keyword: string
    type: QuestionType | 'ALL'
    page: number
  }>({
    keyword: '',
    type: 'ALL',
    page: 1,
  })
  // 对搜索关键词进行防抖，延迟500ms
  const debouncedSearchTerm = useDebounce(filter, 500)
  const { data, isFetching } = useQuery({
    queryKey: ['bank-questions', debouncedSearchTerm],
    queryFn: () =>
      api.questionController.listQuestions({
        req: {
          type:
            debouncedSearchTerm.type === 'ALL'
              ? undefined
              : debouncedSearchTerm.type,
          page: debouncedSearchTerm.page,
          keyword: debouncedSearchTerm.keyword,
        },
      }),
    staleTime: 0,

    enabled: open,
    select: (d) => d.data,
  })

  const pageData = data
  const records = pageData?.records.filter((q) => !existingIds.includes(q.id))
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
      updateSelections({})
      setFilter({
        ...filter,
        page: 1,
      })
    },
    onError: () => toast.error('添加失败'),
  })

  const toggleSelection = (questionId: number) => {
    updateSelections((draft) => {
      if (questionId in draft) {
        delete draft[questionId]
      } else {
        draft[questionId] = { questionId, score: 5 }
      }
    })
  }

  const updateScore = (questionId: number, score: number) => {
    updateSelections((draft) => {
      if (questionId in draft) {
        draft[questionId].score = score
      }
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
      <DialogContent className="flex w-200 max-w-none flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>从题库中选题</DialogTitle>
        </DialogHeader>

        {/* 筛选栏 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="搜索题目..."
              value={filter.keyword}
              onChange={(e) => {
                setFilter({
                  ...filter,
                  keyword: e.target.value,
                  page: 1,
                })
              }}
            />
          </div>
          <div className="w-32">
            <Select
              value={filter.type}
              onValueChange={(v: QuestionType | 'ALL') => {
                setFilter({
                  ...filter,
                  type: v,
                  page: 1,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="全部题型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部题型</SelectItem>
                <SelectItem value="SINGLE_CHOICE">单选题</SelectItem>
                <SelectItem value="MULTIPLE_CHOICE">多选题</SelectItem>
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
              {records?.map((q) => {
                const isSelected = q.id in selections
                const selScore = q.score
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
                        className="size-4"
                        checked={isSelected}
                        onChange={() => toggleSelection(q.id)}
                      />
                    </td>
                    <td className="px-3 py-2">{typeLabel}</td>
                    <td className="max-w-xs truncate px-3 py-2">{q.title}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={selScore}
                        className="h-8 w-20"
                        onChange={(e) =>
                          updateScore(q.id, Number(e.target.value))
                        }
                      />
                    </td>
                  </tr>
                )
              })}
              {records && (
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
              disabled={filter.page <= 1}
              onClick={() =>
                setFilter({
                  ...filter,
                  page: Math.max(1, filter.page - 1),
                })
              }
            >
              上一页
            </Button>
            <span className="text-muted-foreground px-2">
              {filter.page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={filter.page >= totalPages}
              onClick={() =>
                setFilter({
                  ...filter,
                  page: filter.page + 1,
                })
              }
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
                updateSelections({})
                setFilter({
                  keyword: '',
                  type: 'ALL',
                  page: 1,
                })
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
