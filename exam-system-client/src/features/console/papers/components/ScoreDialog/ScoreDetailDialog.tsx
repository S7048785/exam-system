import { DetailQuestionList } from './DetailQuestionList.tsx'
import { ScoreDialogShell } from './ScoreDialogShell.tsx'
import { useScoreDetail } from './useScoreDetail.ts'
import { emptyTextOf } from './utils.ts'
import type { ExamRecordListItemRes } from '#/__generated/model/static'

interface ScoreDetailDialogProps {
  /** 列表行数据：顶栏信息直接复用它（比详情接口多带及格分/排名），无需再查一次 */
  record: ExamRecordListItemRes | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * **查看考试成绩**：只读看该考生本次考试的逐题作答与得分（总览）。
 *
 * 要改分/评分请用 {@link import('./ScoreGradingDialog.tsx').default ScoreGradingDialog}：
 * 两个弹窗共用 {@link ScoreDialogShell}，差别只在题目下方是只读条还是评卷条。
 */
export default function ScoreDetailDialog({
  record,
  open,
  onOpenChange,
}: ScoreDetailDialogProps) {
  const scope = useScoreDetail(record?.id, open)

  return (
    <ScoreDialogShell
      record={record}
      open={open}
      onOpenChange={onOpenChange}
      scope={scope}
    >
      <DetailQuestionList
        ordered={scope.ordered}
        answerMap={scope.answerMap}
        answerByQuestion={scope.answerByQuestion}
        emptyText={emptyTextOf(scope.error, scope.isFetching)}
      />
    </ScoreDialogShell>
  )
}
