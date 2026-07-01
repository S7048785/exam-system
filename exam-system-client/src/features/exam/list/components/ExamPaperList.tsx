import type { PaperDto } from '#/__generated/model/dto'
import { Button } from '#/components/ui/button.tsx'
import { Bookmark, Timer, Trophy } from 'lucide-react'

interface ExamPaperListProps {
  data: ReadonlyArray<PaperDto['PaperController/PAPER_ITEM']>
  onOpenChange: (index: number) => void
}

export default function ExamPaperList({
  data,
  onOpenChange,
}: ExamPaperListProps) {
  return (
    <div className="space-y-6">
      {data.map((item, index) => (
        <div
          key={item.id}
          className="grid items-center gap-x-6 gap-y-2 rounded-lg border px-6 py-4 md:grid-cols-[1fr_auto]"
        >
          {/* 左侧内容：垂直排布 */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold">{item.name}</h3>
            <p className="text-gray-500">{item.description}</p>

            {/* 底部小图标：由于是单行排布，这里依然可以用 flex，或者更简单的 grid-cols-3 */}
            <div className="flex flex-wrap gap-x-6 text-sm">
              <div className="flex items-center gap-1">
                <Bookmark size={16} />
                题目数量: <span className="">{item.questionCount}</span> 道
              </div>
              <div className="flex items-center gap-1">
                <Trophy size={16} />
                总分: <span className="">{item.totalScore}</span> 分
              </div>
              <div className="flex items-center gap-1">
                <Timer size={16} />
                考试时长: <span className="">{item.totalScore}</span> 分钟
              </div>
            </div>
          </div>

          {/* 右侧按钮：自动占据 grid 的第二列 */}
          <Button onClick={() => onOpenChange(index)}>开始考试</Button>
        </div>
      ))}
    </div>
  )
}
