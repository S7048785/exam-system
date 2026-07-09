import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { PAPER_STATUS } from '#/features/admin/papers/constants.ts'
import { Button } from '#/components/ui/button.tsx'
import { Plus } from 'lucide-react'
import type { PaperStatus } from '#/__generated/model/enums'

interface PaperFiltersProps {
  values: { name?: string; status?: PaperStatus }
  onChange: (filters: PaperFiltersProps['values']) => void
  onAdd: () => void
  onRefresh: () => void
}

export function PaperFilters({
  values,
  onChange,
  onAdd,
  onRefresh,
}: PaperFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">试卷名称</Label>
        <Input
          placeholder="搜索名称..."
          value={values.name ?? ''}
          onChange={(e) =>
            onChange({ ...values, name: e.target.value || undefined })
          }
          className="w-[200px]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">状态</Label>
        <Select
          value={values.status ?? 'all'}
          onValueChange={(val) =>
            onChange({
              ...values,
              status: val === 'all' ? undefined : (val as PaperStatus),
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value={PAPER_STATUS.DRAFT}>草稿</SelectItem>
            <SelectItem value={PAPER_STATUS.PUBLISHED}>已发布</SelectItem>
            <SelectItem value={PAPER_STATUS.STOPPED}>已停用</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={onRefresh} className="gap-1.5">
        <Plus className="h-4 w-4" />
        刷新
      </Button>
      <Button onClick={onAdd} className="gap-1.5">
        <Plus className="h-4 w-4" />
        新增试卷
      </Button>
    </div>
  )
}
