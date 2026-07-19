import type { PaperDto } from '#/__generated/model/dto/PaperDto.ts'
import { Button } from '#/components/ui/button.tsx'
import {
  ChevronDown,
  DotIcon,
  File,
  Link,
  Pencil,
  Settings,
  Trash2,
} from 'lucide-react'
import {
  getPaperPhase,
  PAPER_PHASE_LABEL,
  PAPER_PHASE_VARIANT,
} from '../../constants'
import { Badge } from '#/components/ui/badge.tsx'
import { formatDate, formatDateTime } from '#/lib/date-util.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { usePaperListStore } from '#/stores/paper-list.ts'

interface Props {
  item: PaperDto['PaperController/PAPER_ITEM']
  onDelete: (id: number) => void
}

export default function PaperRow({ item, onDelete }: Props) {
  const editPaperAtStep = usePaperListStore((state) => state.editPaperAtStep)
  const phase = getPaperPhase(item.end)

  return (
    <div className="bg-muted space-y-2 border px-4 py-4 shadow">
      <div className="flex items-center justify-between">
        <div>{item.name}</div>
        <div className="inline-flex items-center">
          <Button size="sm" className="h-4 p-0" variant="ghost">
            <Settings />
            设置
          </Button>
          <DotIcon />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 p-0"
              >
                编辑
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="">
              <DropdownMenuItem onClick={() => editPaperAtStep(item.id, 0)}>
                <Pencil className="" />
                编辑试卷
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editPaperAtStep(item.id, 1)}>
                <Pencil className="" />
                设计试卷
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item.id)}>
                <Trash2 className="" />
                删除试卷
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="w-full border"></div>
      <div className="flex items-center justify-between py-2 text-sm">
        <div className="flex items-center">
          <div className="inline-flex items-center">
            <Badge variant={PAPER_PHASE_VARIANT[phase]}>
              {PAPER_PHASE_LABEL[phase]}
            </Badge>
            <div className="ml-2 text-xs">
              <span>{formatDateTime(item.start)}</span> ~{' '}
              <span>{formatDateTime(item.end)}</span>
            </div>
          </div>
          <DotIcon />
          <div>总分: {item.totalScore ?? 0}</div>
          <DotIcon />
          <div>分类</div>
        </div>
        <div className="inline-flex items-center gap-2 text-xs">
          <span className="text-end">
            创建于 {item.createTime && formatDate(item.createTime)}
          </span>
          <button onClick={() => editPaperAtStep(item.id, 2)} className="cursor-pointer" title="查看考试链接">
            {item.published ? <Link size="14" /> : <File size="14" />}
          </button>
        </div>
      </div>
    </div>
  )
}
