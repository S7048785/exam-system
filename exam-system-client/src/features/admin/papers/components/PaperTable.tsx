import type { PaperDto } from '#/__generated/model/dto'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import type { PaperControllerOptions } from '#/__generated/services/PaperController.ts'
import { PaperFilters } from '#/features/admin/papers/components/PaperFilters.tsx'
import PaperTableRow from '#/features/admin/papers/components/PaperTableRow.tsx'
import { PaperTablePagination } from '#/features/admin/papers/components/PaperTablePagination.tsx'
import type { PaperStatus } from '#/__generated/model/enums'

interface PaperTableProps {
  // 数据与分页状态
  pagination: {
    data: readonly PaperDto['PaperController/PAPER_ITEM'][]
    total: number
    page: number
    size: number
  }
  // 过滤状态
  filters: { name?: string; status?: PaperStatus }
  // 操作回调
  onAction: {
    refresh: () => void
    pageChange: (page: number) => void
    sizeChange: (size: number) => void
    filterChange: (filters: PaperTableProps['filters']) => void
    add: () => void
    edit: (id: number) => void
    delete: (id: number) => void
    changeStatus: (param: PaperControllerOptions['updatePaperStatus']) => void
  }
}

export default function PaperTable({
  pagination,
  filters,
  onAction,
}: PaperTableProps) {
  const { data, total, page, size } = pagination
  const totalPages = Math.ceil(total / size)

  return (
    <div className="space-y-4">
      {/* 筛选器 + 新增按钮 */}
      <PaperFilters
        values={filters}
        onChange={onAction.filterChange}
        onAdd={onAction.add}
        onRefresh={onAction.refresh}
      />

      {/* 表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>试卷名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[100px]">时长(分钟)</TableHead>
              <TableHead className="w-[100px]">状态</TableHead>
              <TableHead className="w-[100px]">题目数量</TableHead>
              <TableHead className="w-[100px]">总分</TableHead>
              <TableHead className="w-[160px]">创建时间</TableHead>
              <TableHead className="w-[200px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-muted-foreground h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((paper) => {
                return (
                  <PaperTableRow
                    key={paper.id}
                    item={paper}
                    onEdit={onAction.edit}
                    onDelete={onAction.delete}
                    onStatusChange={onAction.changeStatus}
                  />
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <PaperTablePagination
        size={size}
        page={page}
        total={total}
        onPageChange={onAction.pageChange}
        totalPages={totalPages}
        onSizeChange={onAction.sizeChange}
      />
    </div>
  )
}
