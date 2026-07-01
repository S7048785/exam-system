import { TableCell, TableRow } from '#/components/ui/table.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import {
  PAPER_STATUS,
  PAPER_STATUS_MAP,
} from '#/features/admin/papers/utils.ts'
import { Button } from '#/components/ui/button.tsx'
import { Pencil, Trash2 } from 'lucide-react'
import type { PaperDto } from '#/__generated/model/dto'
import type { PaperControllerOptions } from '#/__generated/services/PaperController.ts'

interface Props {
  item: PaperDto['PaperController/PAPER_ITEM']
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onStatusChange: (param: PaperControllerOptions['updatePaperStatus']) => void
}

export default function PaperTableRow({
  item,
  onStatusChange,
  onEdit,
  onDelete,
}: Props) {
  const statusInfo =
    PAPER_STATUS_MAP[item.status as keyof typeof PAPER_STATUS_MAP]

  const actions = {
    [PAPER_STATUS.DRAFT]: { label: '发布', next: PAPER_STATUS.PUBLISHED },
    [PAPER_STATUS.PUBLISHED]: { label: '停用', next: PAPER_STATUS.STOPPED },
  }

  // keyof (获取键的集合) typeof actions (获取类型)
  const currentAction = actions[item.status as keyof typeof actions]

  return (
    <TableRow key={item.id}>
      <TableCell className="font-medium">{item.id}</TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell className="max-w-[200px] truncate" title={item.description}>
        {item.description ?? '-'}
      </TableCell>
      <TableCell>{item.duration}</TableCell>
      <TableCell>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </TableCell>
      <TableCell>{item.questionCount ?? 0}</TableCell>
      <TableCell>{item.totalScore ?? 0}</TableCell>
      <TableCell>
        {item.createTime ? new Date(item.createTime).toLocaleString() : '-'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {currentAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onStatusChange({ id: item.id, status: currentAction.next })
              }
            >
              {currentAction.label}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit(item.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
