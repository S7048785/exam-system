import { TableCell, TableRow } from '#/components/ui/table.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import {
  getPaperPhase,
  PAPER_PHASE_LABEL,
  PAPER_PHASE_VARIANT,
} from '#/features/admin/papers/constants.ts'
import { Button } from '#/components/ui/button.tsx'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { PaperDto } from '#/__generated/model/dto'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'

interface Props {
  item: PaperDto['PaperController/PAPER_ITEM']
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export default function PaperTableRow({ item, onEdit, onDelete }: Props) {
  const phase = getPaperPhase(item.end)

  return (
    <TableRow key={item.id}>
      <TableCell className="font-medium">{item.id}</TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell className="max-w-50 truncate" title={item.description}>
        {item.description ?? '-'}
      </TableCell>
      <TableCell>{item.duration}</TableCell>
      <TableCell>
        <Badge variant={PAPER_PHASE_VARIANT[phase]}>
          {PAPER_PHASE_LABEL[phase]}
        </Badge>
      </TableCell>
      <TableCell>{item.questionCount ?? 0}</TableCell>
      <TableCell>{item.totalScore ?? 0}</TableCell>
      <TableCell>
        {item.createTime ? new Date(item.createTime).toLocaleString() : '-'}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              编辑
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="">
            <DropdownMenuItem onClick={() => onEdit(item.id)}>
              <Pencil className="" />
              编辑试卷
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(item.id)}>
              <Trash2 className="" />
              删除试卷
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
