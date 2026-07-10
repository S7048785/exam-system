import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { Button } from '#/components/ui/button.tsx'
import { RotateCw } from 'lucide-react'
import type { QuestionListReq } from '#/__generated/model/static'
import { DIFFICULTY_MAP, TYPE_MAP } from '#/types/questoin.ts'
import { flattenCategories } from '#/features/admin/questions/utils.ts'
import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { categoryTreeQueryOptions } from '#/features/admin/questions/questionQueries.ts'

type SearchFilters = Omit<QuestionListReq, 'page' | 'size'>

interface QuestionFiltersProps {
  values: SearchFilters
  onChange: (filters: SearchFilters) => void
  onRefresh: () => void
}

export default function QuestionFilters({
  values,
  onChange,
  onRefresh,
}: QuestionFiltersProps) {
  console.log('重渲染')
  const { data: categoryData } = useSuspenseQuery(categoryTreeQueryOptions)
  const categories = categoryData.data

  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  )

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">分类</Label>
        <Select
          value={values.categoryId?.toString() || 'all'}
          onValueChange={(val) =>
            onChange({
              ...values,
              categoryId: val === 'all' ? undefined : Number(val),
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {flatCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {'　'.repeat(cat.level)}
                {cat.level > 0 && '├ '}
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">难度</Label>
        <Select
          value={values.difficulty || 'all'}
          onValueChange={(val) =>
            onChange({
              ...values,
              difficulty: val === 'all' ? undefined : val,
            })
          }
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="全部难度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部难度</SelectItem>
            {Object.entries(DIFFICULTY_MAP).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">类型</Label>
        <Select
          value={values.type || 'all'}
          onValueChange={(val) =>
            onChange({
              ...values,
              type: val === 'all' ? undefined : val,
            })
          }
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {Object.entries(TYPE_MAP).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">关键词</Label>
        <Input
          placeholder="搜索题目..."
          className="w-48"
          value={values.keyword || ''}
          onChange={(e) =>
            onChange({
              ...values,
              keyword: e.target.value || undefined,
            })
          }
        />
      </div>

      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RotateCw className="mr-1 h-4 w-4" />
        刷新
      </Button>
    </div>
  )
}
