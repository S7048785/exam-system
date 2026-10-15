import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { CircleCheck, CircleX } from 'lucide-react'
import { correctAnswerText } from './utils.ts'
import type { QuestionType } from '#/__generated/model/enums'

/**
 * 评卷条（`mode === 'grade'` 时替换只读的 {@link ReviewBar}）。
 *
 * 「判对 / 判错」与得分**都改**，两者相互独立 —— 简答题可以「判错但给部分分」。
 * 未作答的题不给改（后端也只认已作答的答案）；得分上限就是该题在**这张卷上**的配分
 * （`question.score` 取的是 `paper_question.score`），超出会被输入框夹住，避免整单 422。
 */
export function GradeBar({
  question,
  maxScore,
  correct,
  score,
  answered,
  onCorrectChange,
  onScoreChange,
}: {
  question: { type: QuestionType; answer: string }
  maxScore: number
  correct?: boolean
  score: number
  answered: boolean
  onCorrectChange: (correct: boolean) => void
  onScoreChange: (score: number) => void
}) {
  if (!answered) {
    return (
      <div className="bg-muted/40 flex flex-wrap items-center gap-2 border border-t-0 px-5 py-2.5 text-xs shadow-sm">
        <span className="text-muted-foreground">未作答，不可评卷</span>
      </div>
    )
  }
  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-2 border border-t-0 px-5 py-2.5 text-xs shadow-sm">
      {question.type !== 'TEXT' && (
        <span className="text-muted-foreground">
          标准答案：
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {correctAnswerText(question)}
          </span>
        </span>
      )}
      <span className="text-muted-foreground">评判：</span>
      <div className="flex items-center gap-1.5">
        <Button
          size="xs"
          variant={correct === true ? 'default' : 'outline'}
          className="gap-1"
          onClick={() => onCorrectChange(true)}
        >
          <CircleCheck className="size-3.5" />
          判对
        </Button>
        <Button
          size="xs"
          variant={correct === false ? 'destructive' : 'outline'}
          className="gap-1"
          onClick={() => onCorrectChange(false)}
        >
          <CircleX className="size-3.5" />
          判错
        </Button>
        {correct === undefined && (
          <span className="text-muted-foreground">尚未判定</span>
        )}
      </div>
      <span className="text-muted-foreground ml-auto flex items-center gap-1.5">
        得分
        <Input
          type="number"
          min={0}
          max={maxScore}
          value={String(score)}
          onChange={(e) => {
            const raw = Number(e.target.value)
            const safe = Number.isFinite(raw) ? raw : 0
            onScoreChange(Math.max(0, Math.min(maxScore, Math.trunc(safe))))
          }}
          className="h-7 w-16 px-2 text-xs"
        />
        / {maxScore}
      </span>
    </div>
  )
}
