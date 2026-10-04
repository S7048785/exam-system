import { useMemo } from 'react'
import { cn } from '#/lib/utils.ts'
import { QUESTION_TYPE_META } from '#/features/exam/paper/constants.ts'
import {
  groupQuestionsByType,
  isAnswered,
} from '#/features/exam/paper/utils.ts'
import type { AnswerMap, ExamQuestion } from '#/features/exam/paper/types.ts'

/**
 * 题号格子的配色。
 *
 * - **审阅态**（传了 `results`）只用三种颜色：答对=绿、答错=红、**其余一律灰** ——
 *   灰覆盖「未作答」「简答题（后端不判分）」「未批改（correct 为 null）」，
 *   因为它们都没有对错结论，混进主题色会让人以为是第三种结果。
 * - **答题页**（不传 `results`）两态：已作答=主题色、未作答=只描边，保持原样。
 *
 * 灰底用 `muted-foreground/25` 而不是 `bg-muted`：深色主题下 `--muted` 与弹窗的 `--popover`
 * 几乎同色（oklch 0.269 vs 0.205），用 `bg-muted` 看不出有底。
 */
function cellTone(
  result: 'correct' | 'wrong' | undefined,
  answered: boolean,
  reviewing: boolean,
): string {
  if (result === 'correct') {
    return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-500'
  }
  if (result === 'wrong') {
    return 'border-red-500/40 bg-red-500/5 text-red-500'
  }
  if (reviewing) {
    return 'border-muted-foreground/40 bg-muted-foreground/5 text-muted-foreground'
  }
  return answered
    ? 'border-primary bg-primary text-primary-foreground'
    : 'border-border text-muted-foreground hover:bg-muted'
}

/**
 * 答题页左侧的题号列表（答题卡）。
 *
 * 按题型分组，题号在整卷内连续；已作答的高亮，点击滚到对应题目。
 *
 * 可选传 `results` 时改按**批改结果**着色（答对=绿、答错=红、**其余（未作答/简答题/未批改）=灰**）
 * —— 只有控制台的「答题详情」弹窗会传，答题页不传，行为与以前完全一致。
 */
export function QuestionNavigator({
  questions,
  answers,
  onJump,
  results,
}: {
  questions: ReadonlyArray<ExamQuestion>
  answers: AnswerMap
  /** 点击题号：把对应题目滚进视口 */
  onJump: (questionId: number) => void
  /**
   * 可选：逐题批改结果（`questionId → 对/错`）。
   *
   * - **不传**：维持原样 —— 已作答=主题色、未作答=描边；
   * - **传了**：命中的格子按结果着色，**没命中且未作答的仍保持中性**（不把「没答」误标成红）。
   */
  results?: Readonly<Record<number, 'correct' | 'wrong'>>
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
                const result = results?.[item.question.id]
                const stateLabel =
                  result === 'correct'
                    ? '答对'
                    : result === 'wrong'
                      ? '答错'
                      : answered
                        ? '已作答'
                        : '未作答'
                return (
                  <button
                    key={item.question.id}
                    type="button"
                    onClick={() => onJump(item.question.id)}
                    aria-label={`第 ${item.no} 题，${stateLabel}`}
                    className={cn(
                      'flex size-10 cursor-pointer items-center justify-center border text-xs font-medium tabular-nums transition-colors',
                      cellTone(result, answered, results !== undefined),
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
