import { useImmer } from 'use-immer'
import { useMemo } from 'react'
import { Button } from '#/components/ui/button.tsx'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useGradeAnswersMutation } from '#/features/console/papers/usePaperActions.ts'
import { QuestionNavigator } from '#/features/exam/taking/components/QuestionNavigator.tsx'
import { jumpToQuestion } from '#/features/exam/taking/utils.ts'
import { DetailHeader } from './DetailHeader.tsx'
import { GradeQuestionList } from './GradeQuestionList.tsx'
import { ScoreDialogShell } from './ScoreDialogShell.tsx'
import { useScoreDetail } from './useScoreDetail.ts'
import {
  buildChangedAnswers,
  emptyTextOf,
  mergeMarkingResults,
} from './utils.ts'
import type { EditMap } from './utils.ts'
import type { ExamRecordListItemRes } from '#/__generated/model/static'

interface ScoreGradingDialogProps {
  /** 列表行数据：顶栏信息直接复用它（比详情接口多带及格分/排名），无需再查一次 */
  record: ExamRecordListItemRes | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * **考试评分**：逐题改「判对 / 判错」与得分，顶栏「提交评卷」一次性提交。
 *
 * - 未作答的题不给改（后端也只认已作答的答案）；
 * - 只提交**与库里有差异**的题（没动过的题不下发）；
 * - 库里没判过的题必须点一下对/错，否则提交前拦下来提示；
 * - 提交成功后**关闭弹窗**；重算总分与状态由后端负责，成绩列表的分数 / 状态两列由
 *   `useGradeAnswersMutation` 里的 invalidate 刷新。
 *
 * 只看分数用 {@link import('./ScoreDetailDialog.tsx').default ScoreDetailDialog}。
 */
export default function ScoreGradingDialog({
  record,
  open,
  onOpenChange,
}: ScoreGradingDialogProps) {
  const recordId = record?.publicId
  const scope = useScoreDetail(recordId, open)
  /** 本次编辑（answerRecordId → 改动）；**只存动过的**，没动过的题提交时不下发 */
  const [edits, setEdits] = useImmer<EditMap>({})

  /** 与库里有差异的项才算改动；`correct` 仍为 undefined = 还没点「判对 / 判错」 */
  const changed = buildChangedAnswers(scope.answerRecords, edits)
  const unjudged = changed.filter((item) => item.correct === undefined).length

  /** 关窗顺手清掉未提交的编辑，避免下次打开看到上次的残留 */
  const handleOpenChange = (next: boolean) => {
    if (!next) setEdits({})
    onOpenChange(next)
  }

  /** 提交成功就关窗（`handleOpenChange` 里顺手清了编辑态） */
  const grade = useGradeAnswersMutation(recordId, () => handleOpenChange(false))

  /**
   * 答题卡的着色依据 = 库里的结论 + **本次未提交的判对 / 判错**。
   *
   * `edits` 的 key 是 `answerRecordId`，这里翻译成 `questionId` 后**直接交给答题卡**，
   * 老师在 `GradeBar` 上一点就变色。
   */
  const markingResults = useMemo(
    () => mergeMarkingResults(scope.results, scope.answerRecords, edits),
    [scope.results, scope.answerRecords, edits],
  )

  const handleSubmit = () => {
    if (!recordId) return
    if (changed.length === 0) {
      toast.info('没有改动需要提交')
      return
    }
    if (unjudged > 0) {
      toast.info(`还有 ${unjudged} 题没选「判对 / 判错」`)
      return
    }
    grade.mutate(changed)
  }

  return (
    <ScoreDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      srTitle={`答题详情 · ${record?.studentName ?? ''}`}
      srDescription="逐题评卷：判对 / 判错与给分"
      header={
        record ? (
          <DetailHeader
            record={record}
            detail={scope.detail}
            action={
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={grade.isPending || changed.length === 0}
                title={
                  changed.length === 0
                    ? '还没有改动'
                    : '把本次改动提交给后端（会重算总分与状态）'
                }
                className="gap-1.5"
              >
                {grade.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                提交评卷{changed.length > 0 ? `（${changed.length}）` : ''}
              </Button>
            }
          />
        ) : null
      }
      navigator={
        <QuestionNavigator
          questions={scope.questions}
          answers={scope.answerMap}
          onJump={jumpToQuestion}
          results={markingResults}
        />
      }
    >
      <GradeQuestionList
        ordered={scope.ordered}
        answerMap={scope.answerMap}
        answerByQuestion={scope.answerByQuestion}
        edits={edits}
        onEdit={(answerId, patch) =>
          setEdits((draft) => {
            draft[answerId] = patch
          })
        }
        emptyText={emptyTextOf(scope.error, scope.isFetching)}
      />
    </ScoreDialogShell>
  )
}
