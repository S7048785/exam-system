import { useSuspenseQuery } from '@tanstack/react-query'
import type { QuestionsPageView } from '#/__generated/model/static'
import {
  categoryTreeQueryOptions,
  questionsQueryOptions,
} from '#/features/admin/questions/questionQueries.ts'

import { QUESTION_DIFFICULTY_MAP, QUESTION_TYPE_MAP } from '../constants.ts'
import { flattenCategories } from '#/features/admin/questions/utils.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import { Checkbox } from '#/components/ui/checkbox.tsx'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge.tsx'
import { useMemo, useState } from 'react'

interface QuestionSelectorProps {
  selectedQuestions: Map<number, { score: number }>
  onSelectionChange: (questions: Map<number, { score: number }>) => void
}

export default function QuestionSelector({
  selectedQuestions,
  onSelectionChange,
}: QuestionSelectorProps) {
  const [filters, setFilters] = useState({
    categoryId: undefined as number | undefined,
    type: undefined as string | undefined,
    difficulty: undefined as string | undefined,
  })

  // 获取题目列表
  const { data: listData } = useSuspenseQuery(
    questionsQueryOptions({ page: 1, size: 1000 }),
  )
  const questions = listData.data?.records ?? []

  // 获取分类树并展平
  const { data: categoryData } = useSuspenseQuery(categoryTreeQueryOptions)
  const categories = flattenCategories(categoryData.data ?? [])

  // 分类名称映射
  const categoryNameMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  // 过滤题目
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filters.categoryId && q.categoryId !== filters.categoryId)
        return false
      if (filters.type && q.type !== filters.type) return false
      if (filters.difficulty && q.difficulty !== filters.difficulty)
        return false
      return true
    })
  }, [questions, filters])

  // 全选状态
  const selectedIds = Array.from(selectedQuestions.keys())
  const isAllSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedIds.includes(q.id))

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newMap = new Map(selectedQuestions)
      filteredQuestions.forEach((q) => {
        if (!newMap.has(q.id)) {
          newMap.set(q.id, { score: q.score ?? 5 })
        }
      })
      onSelectionChange(newMap)
    } else {
      const newMap = new Map(selectedQuestions)
      filteredQuestions.forEach((q) => newMap.delete(q.id))
      onSelectionChange(newMap)
    }
  }

  // 单选/取消
  const handleSelect = (question: QuestionsPageView, checked: boolean) => {
    const newMap = new Map(selectedQuestions)
    if (checked) {
      newMap.set(question.id, { score: question.score ?? 5 })
    } else {
      newMap.delete(question.id)
    }
    onSelectionChange(newMap)
  }

  // 分数变化
  const handleScoreChange = (id: number, score: number) => {
    const newMap = new Map(selectedQuestions)
    const existing = newMap.get(id)
    if (existing) {
      newMap.set(id, { ...existing, score })
      onSelectionChange(newMap)
    }
  }

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">题目类型</Label>
          <select
            className="border-input bg-background flex h-9 w-[140px] rounded-md border px-3 py-1 text-sm"
            value={filters.type ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value || undefined })
            }
          >
            <option value="">全部</option>
            <option value="CHOICE">选择题</option>
            <option value="JUDGE">判断题</option>
            <option value="TEXT">简答题</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">难度</Label>
          <select
            className="border-input bg-background flex h-9 w-[120px] rounded-md border px-3 py-1 text-sm"
            value={filters.difficulty ?? ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                difficulty: e.target.value || undefined,
              })
            }
          >
            <option value="">全部</option>
            <option value="EASY">简单</option>
            <option value="MEDIUM">普通</option>
            <option value="HARD">困难</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">分类</Label>
          <select
            className="border-input bg-background flex h-9 w-[160px] rounded-md border px-3 py-1 text-sm"
            value={filters.categoryId ?? ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                categoryId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          >
            <option value="">全部</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 已选数量 */}
      <div className="text-muted-foreground text-sm">
        已选择 {selectedQuestions.size} 道题目
      </div>

      {/* 题目表格 */}
      <div className="max-h-[400px] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>题目标题</TableHead>
              <TableHead className="w-[100px]">题目类型</TableHead>
              <TableHead className="w-[100px]">难度</TableHead>
              <TableHead className="w-[120px]">所属分类</TableHead>
              <TableHead className="w-[100px]">分数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredQuestions.map((question) => {
                const isSelected = selectedIds.includes(question.id)
                const typeInfo = QUESTION_TYPE_MAP[question.type]
                const difficultyInfo =
                  QUESTION_DIFFICULTY_MAP[question.difficulty]

                return (
                  <TableRow
                    key={question.id}
                    className={isSelected ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelect(question, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{question.id}</TableCell>
                    <TableCell
                      className="max-w-[300px] truncate"
                      title={question.title}
                    >
                      {question.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${difficultyInfo.className}`}
                      >
                        {difficultyInfo.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {categoryNameMap.get(question.categoryId)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 w-[80px]"
                        value={
                          selectedQuestions.get(question.id)?.score ??
                          question.score ??
                          5
                        }
                        onChange={(e) =>
                          handleScoreChange(question.id, Number(e.target.value))
                        }
                        disabled={!isSelected}
                        min={0}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
