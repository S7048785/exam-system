import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { Plus, X } from 'lucide-react'
import CategoryTreePicker from '#/components/category-tree/CategoryTreePicker.tsx'
import type { TreeNode } from '#/components/category-tree/CategoryTreePicker.tsx'
import type { PageListFilterType } from '#/routes/_auth/papers/list.tsx'
import type { PaperStatus } from '#/__generated/model/enums'

interface PaperFiltersProps {
  values: PageListFilterType
  onChange: (filters: PageListFilterType) => void
  onRefresh: () => void
  categoryTree: readonly TreeNode[]
}

/**
 * 后端 `PaperStatus` 四态筛选。
 *
 * ⚠️ 文案与枚举名的对应关系以后端 `PaperService.listPapersByNameAndStatus` 的实现为准，
 * **不是**按枚举名直译（枚举源码里的注释与实现相反，别被它带跑）：
 * `PUBLISHED` 分支是 `start >= now` → 未开始；`PENDING` 分支是区间内 → 进行中。
 */
const PAPER_STATUS_OPTIONS: ReadonlyArray<{
  value: PaperStatus
  label: string
}> = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PENDING', label: '未开始' },
  { value: 'PUBLISHED', label: '进行中' },
  { value: 'FINISHED', label: '已结束' },
]

export function PaperFilters({
  values,
  onChange,
  onRefresh,
  categoryTree,
}: PaperFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">试卷名称</Label>
        <Input
          placeholder="搜索名称..."
          value={values.name ?? ''}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          className="w-50 block"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">试卷分类</Label>
        <div className="flex items-center gap-1">
          <CategoryTreePicker
            nodes={categoryTree}
            value={values.categoryId}
            onChange={(id) => onChange({ ...values, categoryId: id })}
            placeholder="全部分类"
            className="w-50"
          />
          {values.categoryId != null && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onChange({ ...values, categoryId: undefined })}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">考试状态</Label>
        <Select
          value={values.status ?? 'ALL'}
          onValueChange={(v) =>
            onChange({
              ...values,
              status: v === 'ALL' ? undefined : (v as PaperStatus),
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部状态</SelectItem>
            {PAPER_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={onRefresh} className="gap-1.5">
        <Plus className="h-4 w-4" />
        刷新
      </Button>
    </div>
  )
}
