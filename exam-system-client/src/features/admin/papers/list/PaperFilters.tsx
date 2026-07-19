import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
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
import type {PageListFilterType} from "#/routes/admin/papers/list.tsx";


interface PaperFiltersProps {
  values: PageListFilterType
  onChange: (filters: PageListFilterType) => void
  onRefresh: () => void
  categoryTree: readonly TreeNode[]
}

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
          className="w-50"
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
          value={values.ongoing === undefined ? 'ALL' : String(values.ongoing)}
          onValueChange={(v) =>
            onChange({ ...values, ongoing: v === 'ALL' ? undefined : v === 'true' })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部状态</SelectItem>
            <SelectItem value="true">进行中</SelectItem>
            <SelectItem value="false">已结束</SelectItem>
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
