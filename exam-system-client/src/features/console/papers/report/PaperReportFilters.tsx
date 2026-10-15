import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Button } from '#/components/ui/button.tsx'
import { RefreshCw } from 'lucide-react'
import CategoryTreePicker from '#/components/category-tree/CategoryTreePicker.tsx'
import type { TreeNode } from '#/components/category-tree/CategoryTreePicker.tsx'
import type { PaperReportListQuery } from '#/__generated/model/static'

/** 列表筛选条件（分页参数由页面自己管，不进这里） */
export type ReportFilterType = Omit<PaperReportListQuery, 'page' | 'size'>

interface PaperReportFiltersProps {
  values: ReportFilterType
  onChange: (filters: ReportFilterType) => void
  onRefresh: () => void
  categoryTree: readonly TreeNode[]
}

/**
 * 报表筛选栏。
 *
 * 时间用的是 `<input type="datetime-local">` —— 它给出的 `YYYY-MM-DDTHH:mm`
 * 正好是后端 `@DateTimeFormat(iso = ISO.DATE_TIME)` 认的格式，不需要额外转换。
 *
 * ⚠️ 两对时间区间是**两个不同的字段**，别按「交卷时间」理解：
 * `startFrom/startTo` 筛的是试卷的**开考时间**（`paper_exam_settings.start`），
 * `endFrom/endTo` 筛的是**结束时间**（`...end`）；两端都是闭区间，留空即不筛。
 */
export function PaperReportFilters({
  values,
  onChange,
  onRefresh,
  categoryTree,
}: PaperReportFiltersProps) {
  const setTime = (
    key: 'startFrom' | 'startTo' | 'endFrom' | 'endTo',
    raw: string,
  ) => onChange({ ...values, [key]: raw === '' ? undefined : raw })

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">试卷名称</Label>
        <Input
          placeholder="搜索名称..."
          value={values.name ?? ''}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          className="block w-50"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-muted-foreground block text-xs">试卷分类</Label>
        <CategoryTreePicker
          nodes={categoryTree}
          value={values.categoryId}
          onChange={(id) => onChange({ ...values, categoryId: id })}
          placeholder="全部分类"
          className="w-40"
          clearable
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-muted-foreground block text-xs">开考时间</Label>
        <div className="flex items-center gap-1.5">
          <Input
            type="datetime-local"
            value={values.startFrom ?? ''}
            onChange={(e) => setTime('startFrom', e.target.value)}
            className="w-48"
            aria-label="开考时间起"
          />
          <span className="text-muted-foreground text-xs">至</span>
          <Input
            type="datetime-local"
            value={values.startTo ?? ''}
            onChange={(e) => setTime('startTo', e.target.value)}
            className="w-48"
            aria-label="开考时间止"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-muted-foreground block text-xs">结束时间</Label>
        <div className="flex items-center gap-1.5">
          <Input
            type="datetime-local"
            value={values.endFrom ?? ''}
            onChange={(e) => setTime('endFrom', e.target.value)}
            className="w-48"
            aria-label="结束时间起"
          />
          <span className="text-muted-foreground text-xs">至</span>
          <Input
            type="datetime-local"
            value={values.endTo ?? ''}
            onChange={(e) => setTime('endTo', e.target.value)}
            className="w-48"
            aria-label="结束时间止"
          />
        </div>
      </div>

      <Button variant="outline" onClick={onRefresh} className="gap-1.5">
        <RefreshCw className="h-4 w-4" />
        刷新
      </Button>
    </div>
  )
}
