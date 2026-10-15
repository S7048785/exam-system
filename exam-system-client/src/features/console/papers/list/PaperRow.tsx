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
  TrendingUp,
} from 'lucide-react'
import {
  getPaperPhase,
  PAPER_PHASE_LABEL,
  PAPER_PHASE_VARIANT,
} from '../constants.ts'
import { Badge } from '#/components/ui/badge.tsx'
import { formatDate, formatDateTime } from '#/lib/date-util.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import { usePaperListStore } from '#/stores/paper-list.ts'
import { useState } from 'react'
import PaperSettingsDialog from './PaperSettingsDialog.tsx'
import ScoreListDialog from '../components/ScoreListDialog'

interface Props {
  item: PaperDto['PaperController/PAPER_ITEM']
  onDelete: (id: number) => void
}

export default function PaperRow({ item, onDelete }: Props) {
  const editPaperAtStep = usePaperListStore((state) => state.editPaperAtStep)
  // 起止时间已随「考试设置」搬到 1:1 的 paper_exam_settings，列表里是嵌套字段且可能为空
  const [settingsOpen, setSettingsOpen] = useState(false)
  // 「成绩」和「设置」是两个弹窗，各自独立开关（此前两者共用一个 state）
  const [gradeOpen, setGradeOpen] = useState(false)
  const phase = getPaperPhase(
    item.published,
    item.examSettings?.start,
    item.examSettings?.end,
  )

  return (
    <div className="bg-muted space-y-2 border px-4 py-4 shadow">
      <div className="flex items-center justify-between">
        <div>{item.name}</div>
        <div className="inline-flex items-center">
          <Button
            size="sm"
            className="mr-4 p-2"
            variant="outline"
            onClick={() => setGradeOpen(true)}
          >
            <TrendingUp />
            <span className="">成绩({item.scoreCount})</span>
          </Button>
          <Button
            size="sm"
            className="h-4 p-0"
            variant="ghost"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings />
            设置
          </Button>
          <DotIcon />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-4 p-0">
                编辑
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => editPaperAtStep(item.id, 0)}>
                <Pencil size={16} />
                编辑试卷
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editPaperAtStep(item.id, 1)}>
                <Pencil size={16} />
                设计试卷
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item.id)}>
                <Trash2 size={16} />
                删除试卷
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="w-full border"></div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <div className="inline-flex items-center">
            <Badge variant={PAPER_PHASE_VARIANT[phase]}>
              {PAPER_PHASE_LABEL[phase]}
            </Badge>
            <div className="ml-2 text-xs">
              {item.examSettings ? (
                <>
                  <span>{formatDateTime(item.examSettings.start)}</span> ~{' '}
                  <span>{formatDateTime(item.examSettings.end)}</span>
                </>
              ) : (
                <span>未设置考试时间</span>
              )}
            </div>
          </div>
          <DotIcon />
          <div>总分: {item.totalScore ?? 0}</div>
          <DotIcon />
          <div>{item.category.name}</div>
        </div>
        <div className="inline-flex items-center gap-2 text-xs">
          <span className="text-end">
            创建于 {item.createTime && formatDate(item.createTime)}
          </span>
          <button
            onClick={() => editPaperAtStep(item.id, 2)}
            className="cursor-pointer"
            title="查看考试链接"
          >
            {item.published ? <Link size="14" /> : <File size="14" />}
          </button>
        </div>
      </div>

      {/* 成绩弹窗（列表行「成绩」入口）：该试卷全部考试记录 */}
      <ScoreListDialog
        paperId={item.id}
        paperName={item.name}
        open={gradeOpen}
        onOpenChange={setGradeOpen}
      />

      {/* 试卷配置弹窗（列表行「设置」入口） */}
      <PaperSettingsDialog
        paperId={item.id}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  )
}
