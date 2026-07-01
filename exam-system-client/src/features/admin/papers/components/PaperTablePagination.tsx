import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { Button } from '#/components/ui/button.tsx'

interface Props {
  total: number
  page: number
  totalPages: number
  size: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
}

export function PaperTablePagination({
  size,
  onSizeChange,
  onPageChange,
  totalPages,
  total,
  page,
}: Props) {
  if (total <= 0) return null
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground text-sm">
        共 {total} 条，第 {page} / {totalPages} 页
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={size.toString()}
          onValueChange={(val) => onSizeChange(Number(val))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 条/页</SelectItem>
            <SelectItem value="20">20 条/页</SelectItem>
            <SelectItem value="50">50 条/页</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
