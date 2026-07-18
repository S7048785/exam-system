import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button.tsx'
import { Plus } from 'lucide-react'
import { usePaperListStore } from '#/stores/paper-list.ts'

interface PaperFiltersProps {
  values: { name?: string }
  onChange: (filters: PaperFiltersProps['values']) => void
  onRefresh: () => void
}

export function PaperFilters({
  values,
  onChange,
  onRefresh,
}: PaperFiltersProps) {
  const addPaper = usePaperListStore((state) => state.addPaper)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">试卷名称</Label>
        <Input
          placeholder="搜索名称..."
          value={values.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value || undefined })}
          className="w-50"
        />
      </div>
      <Button variant="outline" onClick={onRefresh} className="gap-1.5">
        <Plus className="h-4 w-4" />
        刷新
      </Button>
      <Button onClick={addPaper} className="gap-1.5">
        <Plus className="h-4 w-4" />
        新增试卷
      </Button>
    </div>
  )
}
