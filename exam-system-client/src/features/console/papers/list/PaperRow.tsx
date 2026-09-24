import type { PaperDto } from '#/__generated/model/dto/PaperDto.ts'
import { Button } from '#/components/ui/button.tsx'
import {
  ChevronDown,
  DotIcon,
  File,
  Link,
  Pencil,
  RotateCcw,
  Settings,
  Trash2,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover.tsx'
import { HelpCircle } from 'lucide-react'

interface Props {
  item: PaperDto['PaperController/PAPER_ITEM']
  onDelete: (id: number) => void
  onUnpublish: (id: number) => void
}

export default function PaperRow({ item, onDelete, onUnpublish }: Props) {
  const editPaperAtStep = usePaperListStore((state) => state.editPaperAtStep)
  const phase = getPaperPhase(item.published, item.start, item.end)
  // 撤回确认框是否打开（受控：非受控时「取消」按钮点了不会关）
  const [unpublishOpen, setUnpublishOpen] = useState(false)

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
              <Button variant="ghost" size="sm" className="h-4 p-0">
                编辑
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => editPaperAtStep(item.id, 0)}>
                <Pencil size={16}/>
                编辑试卷
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editPaperAtStep(item.id, 1)}>
                <Pencil size={16}/>
                设计试卷
              </DropdownMenuItem>
              {/* 只有已发布的卷能撤回；草稿态没有「撤回」这个概念 */}
              {item.published && (
                <DropdownMenuItem
                  onClick={(e) => {
                    // 阻止菜单默认的关闭行为，让 Popover 接管
                    e.preventDefault()
                    setUnpublishOpen(true)
                  }}
                >
                  <RotateCcw size={16}/>
                  撤回发布
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(item.id)}>
                <Trash2 size={16}/>
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
            <Popover open={unpublishOpen} onOpenChange={setUnpublishOpen}>
              <PopoverTrigger asChild>
                {/* 触发器藏起来：入口是上面的下拉菜单项 */}
                <span className="sr-only" />
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="leading-none font-medium">
                        确定要撤回发布吗？
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        撤回后试卷回到
                        <span className="font-medium">草稿</span>
                        状态，可以继续修改题目。
                        <br />
                        该试卷下的
                        <span className="text-destructive font-medium">
                          所有考试记录（含正在考试的）将被永久删除，无法恢复
                        </span>
                        。
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUnpublishOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        onUnpublish(item.id)
                        setUnpublishOpen(false)
                      }}
                    >
                      确定撤回
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
    </div>
  )
}
