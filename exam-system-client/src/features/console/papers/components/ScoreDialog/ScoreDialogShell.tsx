import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { QuestionNavigator } from '#/features/exam/paper/components/QuestionNavigator.tsx'
import { DetailHeader } from './DetailHeader.tsx'
import type { ScoreDetailScope } from './useScoreDetail.ts'
import type { ExamRecordListItemRes } from '#/__generated/model/static'

interface ScoreDialogShellProps {
  /** 列表行：及格分 / 排名 / 用时 / 总分只有它有，详情接口不带 */
  record: ExamRecordListItemRes | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** {@link useScoreDetail} 的返回值整体传进来 */
  scope: ScoreDetailScope
  /** 顶栏右侧的额外动作（评分弹窗传「提交评卷」按钮） */
  action?: ReactNode
  /** 右侧题目列表：两个弹窗各传自己的（`DetailQuestionList` / `GradeQuestionList`） */
  children: ReactNode
}

/**
 * 成绩详情 / 考试评分两个弹窗**共用的壳**：对话框 + 顶栏 + 左答题卡 + 右侧题目列表。
 *
 * 布局 **1:1 复刻答题页**（`routes/_public/exam.paper.$paperId.tsx`）：顶栏（试卷名 + 考生 + 统计格）
 * → 左答题卡题号 → 右题目列表；题卡只读引用答题页的组件，**没有改动考试模块的任何文件**。
 * 两个弹窗的差异只有「用哪个题目列表」和「顶栏那颗提交按钮」——所以列表由调用方以 `children` 传进来。
 */
export function ScoreDialogShell({
  record,
  open,
  onOpenChange,
  scope,
  action,
  children,
}: ScoreDialogShellProps) {
  /** 与答题页同一套跳题逻辑：题卡自带 `id="question-{id}"`，滚到最近的滚动祖先 */
  const jumpToQuestion = (questionId: number) => {
    document
      .getElementById(`question-${questionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-h-[88vh] w-[96%] max-w-7xl flex-col gap-0 overflow-hidden p-0">
        {/* 顶栏已把信息显示全了，标题只留给读屏 */}
        <DialogTitle className="sr-only">
          答题详情 · {record?.studentName ?? ''}
        </DialogTitle>
        <DialogDescription className="sr-only">
          查看该考生本次考试的逐题作答与得分
        </DialogDescription>

        {record ? (
          <DetailHeader
            record={record}
            paperName={scope.detail?.paper.name ?? ''}
            score={scope.detail?.score ?? record.score}
            status={scope.detail?.status ?? record.status}
            action={action}
          />
        ) : null}

        <div className="flex min-h-0 flex-1">
          {/* 左侧答题卡：原样复用，点题号可滚到对应题目；`results` 只在控制台传，按对错着色 */}
          <QuestionNavigator
            questions={scope.questions}
            answers={scope.answerMap}
            onJump={jumpToQuestion}
            results={scope.results}
          />

          {/* 右侧题目列表：与答题页同宽（w-10/11）、同间距（space-y-5 p-6） */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="w-10/11 space-y-5 p-6">{children}</div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}
