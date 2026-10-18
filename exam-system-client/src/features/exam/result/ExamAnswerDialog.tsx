import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlarmClock,
  BookOpenCheck,
  GraduationCap,
  Target,
  Trophy,
} from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { formatDateTime, formatUsedTime } from '#/lib/date-util.ts'
import { examDetailQueryOptions } from '#/features/exam/examQueries.ts'
import { QuestionNavigator } from '#/features/exam/taking/components/QuestionNavigator.tsx'
import { StatChip } from '#/features/exam/taking/components/StatChip.tsx'
import { jumpToQuestion } from '#/features/exam/taking/utils.ts'
import { DetailQuestionList } from '#/features/console/papers/components/ScoreDialog/DetailQuestionList.tsx'
import { ScoreDialogShell } from '#/features/console/papers/components/ScoreDialog/ScoreDialogShell.tsx'
import {
  deriveDetail,
  emptyTextOf,
} from '#/features/console/papers/components/ScoreDialog/utils.ts'
import type { ExamResultRes } from '#/__generated/model/static'

/**
 * 「查看答案解析」按钮 + 弹窗（**考试结果页**用）。
 *
 * 数据源 `GET /exams/{publicId}/detail`（考生侧）：逐题的标准答案、本人作答、得分、对错与题目解析。
 * 弹窗零件与控制台「答题详情」是同一套（`ScoreDialogShell` 布局 + `QuestionNavigator` 答题卡 +
 * `DetailQuestionList` 只读题卡），派生口径也共用 `deriveDetail`，两边不会漂移。
 *
 * 只在点开时才拉详情（`enabled={open}`），不占结果页首屏请求；
 * 调用方按 `result.showAnswerAfterSubmit` 决定要不要渲染本组件（后端详情接口也按同一开关拦）。
 */
export function ExamAnswerDialog({
  publicId,
  result,
}: {
  /** 考试记录短码 */
  publicId: string
  /** 结果接口的数据：弹窗顶栏直接复用，不必再多请求一次 */
  result: ExamResultRes
}) {
  const [open, setOpen] = useState(false)
  const { data, isFetching, error } = useQuery({
    ...examDetailQueryOptions(publicId),
    enabled: open,
  })
  const scope = deriveDetail(data)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <BookOpenCheck className="size-4" />
        查看答案解析
      </Button>

      <ScoreDialogShell
        open={open}
        onOpenChange={setOpen}
        srTitle="答案解析"
        srDescription="本次考试逐题的标准答案、你的作答、得分与题目解析"
        header={<AnswerHeader result={result} />}
        navigator={
          <QuestionNavigator
            questions={scope.questions}
            answers={scope.answerMap}
            onJump={jumpToQuestion}
            results={scope.results}
          />
        }
      >
        <DetailQuestionList
          ordered={scope.ordered}
          answerMap={scope.answerMap}
          answerByQuestion={scope.answerByQuestion}
          emptyText={emptyTextOf(error, isFetching)}
          showAnalysis
        />
      </ScoreDialogShell>
    </>
  )
}

/** 弹窗顶栏：试卷名 + 交卷时间，右侧成绩三格（口径同结果页） */
function AnswerHeader({ result }: { result: ExamResultRes }) {
  return (
    <header className="bg-background/80 flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {result.paperName}
          </div>
          <div className="text-muted-foreground truncate text-xs">
            交卷于 {formatDateTime(result.endTime)}
          </div>
        </div>
      </div>

      {/* pr-14 给弹窗右上角自带的关闭按钮让位 */}
      <div className="flex shrink-0 items-center gap-2 pr-14">
        <StatChip
          icon={<Trophy className="size-4" />}
          label="得分 / 总分"
          value={`${result.score} / ${result.totalScore}`}
          tone={result.score >= result.passingScore ? 'success' : 'default'}
        />
        <StatChip
          icon={<Target className="size-4" />}
          label="及格分"
          value={String(result.passingScore)}
        />
        <StatChip
          icon={<AlarmClock className="size-4" />}
          label="用时"
          value={formatUsedTime(result.usedSeconds)}
        />
      </div>
    </header>
  )
}
