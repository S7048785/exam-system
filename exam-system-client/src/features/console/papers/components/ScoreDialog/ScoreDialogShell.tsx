import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog.tsx'

interface ScoreDialogShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 顶栏已把信息显示全了，标题只留给读屏 */
  srTitle: string
  srDescription: string
  /** 顶栏（调用方组装 `DetailHeader`） */
  header?: ReactNode
  /** 左侧答题卡（调用方组装 `QuestionNavigator`；不需要就不传） */
  navigator?: ReactNode
  /** 右侧题目列表（`DetailQuestionList` / `GradeQuestionList`） */
  children: ReactNode
}

/**
 * 成绩详情 / 考试评分两个弹窗共用的**布局壳**：对话框尺寸 + 顶栏位 + 左答题卡位 + 右内容区。
 *
 * 这里**只管布局，不认识任何业务数据** —— 顶栏和答题卡由调用方组装好了传进来，
 * 于是「答题卡按什么着色」之类的参数直接给 `QuestionNavigator` 即可，
 * 不必再绕过壳（原先整个 `scope` 传进来，想换一个字段就只能 `{...scope, results}` 地覆盖）。
 *
 * 布局 **1:1 复刻答题页**（`routes/_public/exam.taking.$paperId.tsx`）：顶栏 → 左答题卡 →
 * 右题目列表（同宽 `w-10/11`、同间距 `space-y-5 p-6`）。这份约束集中在此维护，
 * 两个弹窗不会各自漂移。
 */
export function ScoreDialogShell({
  open,
  onOpenChange,
  srTitle,
  srDescription,
  header,
  navigator,
  children,
}: ScoreDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-h-[88vh] w-[96%] max-w-7xl flex-col gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{srTitle}</DialogTitle>
        <DialogDescription className="sr-only">
          {srDescription}
        </DialogDescription>

        {header}

        <div className="flex min-h-0 flex-1">
          {navigator}

          {/* 右侧题目列表：与答题页同宽（w-10/11）、同间距（space-y-5 p-6） */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="w-10/11 space-y-5 p-6">{children}</div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}
