import { useMemo } from 'react'
import { cn } from '#/lib/utils.ts'
import { QUESTION_TYPE_META } from '#/features/exam/paper/constants.ts'
import {
  groupQuestionsByType,
  isAnswered,
} from '#/features/exam/paper/utils.ts'
import type { AnswerMap, ExamQuestion } from '#/features/exam/paper/types.ts'

/**
 * 答题页左侧的题号列表（答题卡）。
 *
 * 按题型分组，题号在整卷内连续；已作答的高亮，点击滚到对应题目。
 */
export function QuestionNavigator({
  questions,
  answers,
  onJump,
}: {
  questions: ReadonlyArray<ExamQuestion>
  answers: AnswerMap
  /** 点击题号：把对应题目滚进视口 */
  onJump: (questionId: number) => void
}) {
  const groups = useMemo(() => groupQuestionsByType(questions), [questions])

  return (
    <aside className="shrink-0 overflow-y-auto border-r p-10">
      <div className="text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase">
        答题卡
      </div>

      {groups.map((group) => {
        const answeredInGroup = group.items.filter((item) =>
          isAnswered(answers[item.question.id]),
        ).length

        return (
          <div key={group.type} className="mb-5 last:mb-0">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium">
                {QUESTION_TYPE_META[group.type].label}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {answeredInGroup}/{group.items.length}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {group.items.map((item) => {
                const answered = isAnswered(answers[item.question.id])
                return (
                  <button
                    key={item.question.id}
                    type="button"
                    onClick={() => onJump(item.question.id)}
                    aria-label={`第 ${item.no} 题${answered ? '，已作答' : '，未作答'}`}
                    className={cn(
                      'flex size-10 cursor-pointer items-center justify-center border text-xs font-medium tabular-nums transition-colors',
                      answered
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {item.no}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
