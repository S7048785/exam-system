import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '#/components/ui/button.tsx'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '#/ApiInstance.ts'
import { GradeQuestionList } from './GradeQuestionList.tsx'
import { ScoreDialogShell } from './ScoreDialogShell.tsx'
import { useScoreDetail } from './useScoreDetail.ts'
import { buildChangedAnswers, emptyTextOf } from './utils.ts'
import type { EditMap } from './utils.ts'
import type {
  ExamRecordListItemRes,
  GradeAnswerReq,
} from '#/__generated/model/static'

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
 * - 提交后重算总分与状态由后端负责，这里刷新详情与父列表（成绩列表的分数、状态两列）。
 *
 * 只看分数用 {@link import('./ScoreDetailDialog.tsx').default ScoreDetailDialog}。
 */
export default function ScoreGradingDialog({
  record,
  open,
  onOpenChange,
}: ScoreGradingDialogProps) {
  const recordId = record?.id
  const queryClient = useQueryClient()
  const scope = useScoreDetail(recordId, open)
  /** 本次编辑（answerRecordId → 改动）；**只存动过的**，没动过的题提交时不下发 */
  const [edits, setEdits] = useState<EditMap>({})

  /** 与库里有差异的项才算改动；`correct` 仍为 undefined = 还没点「判对 / 判错」 */
  const changed = buildChangedAnswers(scope.answerRecords, edits)
  const unjudged = changed.filter((item) => item.correct === undefined).length

  const grade = useMutation({
    mutationFn: (items: GradeAnswerReq[]) =>
      api.examController.gradeAnswers({
        examRecordId: String(recordId),
        body: items,
      }),
    onSuccess: async () => {
      toast.success('评卷已提交')
      setEdits({})
      // 详情里各题的对错/得分，以及父弹窗列表的分数、状态两列都要跟着变
      await queryClient.invalidateQueries({
        queryKey: ['examRecordDetail', recordId],
      })
      await queryClient.invalidateQueries({ queryKey: ['paperExamRecords'] })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : '提交评卷失败'),
  })

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

  /** 关窗顺手清掉未提交的编辑，避免下次打开看到上次的残留 */
  const handleOpenChange = (next: boolean) => {
    if (!next) setEdits({})
    onOpenChange(next)
  }

  return (
    <ScoreDialogShell
      record={record}
      open={open}
      onOpenChange={handleOpenChange}
      scope={scope}
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
          {grade.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          提交评卷{changed.length > 0 ? `（${changed.length}）` : ''}
        </Button>
      }
    >
      <GradeQuestionList
        ordered={scope.ordered}
        answerMap={scope.answerMap}
        answerByQuestion={scope.answerByQuestion}
        edits={edits}
        onEdit={(answerId, patch) =>
          setEdits((prev) => ({ ...prev, [answerId]: patch }))
        }
        emptyText={emptyTextOf(scope.error, scope.isFetching)}
      />
    </ScoreDialogShell>
  )
}
