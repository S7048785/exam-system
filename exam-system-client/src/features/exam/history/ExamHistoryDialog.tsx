import { useState } from 'react'
import { History } from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { ExamHistoryList } from './ExamHistoryList.tsx'

/**
 * 「查看历史成绩」按钮 + 弹窗（结果页与考试入口页共用）。
 *
 * 列表只显示**当前这张试卷 + 当前登录考生**的记录（`GET /exams/history?paperId=`，服务端过滤）。
 * 历史只在点开时才拉（`enabled={open}`），不占首屏请求。
 * ⚠️ 只有登录考生才有历史：`GET /exams/history` 要求登录，且匿名考试记录的 `user_id` 为空、
 * 本来就不会出现在任何人的历史里 —— 所以调用方在未登录时直接不渲染本组件。
 */
export function ExamHistoryDialog({
  paperId,
  currentPublicId,
  size = 'sm',
  className,
}: {
  /** 当前试卷 id（历史只查这张卷） */
  paperId: number
  /**
   * 结果页传入：确认「正在看的那条」属于当前登录用户。
   * 入口页没有「当前记录」，不传（列表本身就是这个账号自己的记录）。
   */
  currentPublicId?: string
  size?: 'sm' | 'lg'
  /** 按钮额外样式（入口页要拉满宽度） */
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <History className="size-4" />
        查看历史成绩
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92%] max-w-lg">
          <DialogHeader>
            <DialogTitle>历史成绩</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            你在本张试卷上各次作答的成绩与用时，点击一条查看详情
          </DialogDescription>

          <ExamHistoryList
            currentPublicId={currentPublicId}
            paperId={paperId}
            enabled={open}
            onNavigate={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
