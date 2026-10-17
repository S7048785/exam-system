import { QuestionCard } from '#/features/exam/taking/components/QuestionCard.tsx'
import { GradeBar } from './GradeBar.tsx'
import { noop, originalCorrectOf } from './utils.ts'
import type { DetailAnswerRecord, DetailQuestion, EditMap } from './utils.ts'
import type { AnswerMap } from '#/features/exam/taking/types.ts'

interface GradeQuestionListProps {
  /** 已按题型排好序的题目（题号也在这里） */
  ordered: ReadonlyArray<{ no: number; question: DetailQuestion }>
  /** `questionId → 题卡要的选项值` */
  answerMap: AnswerMap
  /** `questionId → 库里的答案行` */
  answerByQuestion: ReadonlyMap<number, DetailAnswerRecord>
  /** 本次未提交的编辑（`answerRecordId` → 改动），**只存动过的题** */
  edits: EditMap
  onEdit: (
    answerId: number,
    patch: { correct?: boolean; score: number },
  ) => void
  /** 题目为空时显示的文案（加载中 / 报错 / 暂无） */
  emptyText: string
}

/**
 * **考试评分**用的逐题列表：每题下方是可改的 `GradeBar`（判对/判错 + 得分）。
 *
 * 值为「本次编辑优先、回落库里的值」：没动过的题不下发，动过的以编辑态显示。
 * 未作答的题由 `GradeBar` 自己拦截（显示「未作答，不可评卷」）。
 */
export function GradeQuestionList({
  ordered,
  answerMap,
  answerByQuestion,
  edits,
  onEdit,
  emptyText,
}: GradeQuestionListProps) {
  if (ordered.length === 0) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        {emptyText}
      </div>
    )
  }
  return (
    <>
      {ordered.map(({ no, question }) => {
        const answer = answerByQuestion.get(question.id)
        const answered = !!answer && answer.userAnswer.trim() !== ''
        const edit = answer ? edits[answer.id] : undefined
        // 库里判过就沿用，没判过（null）留「尚未判定」让老师点
        const correct = edit?.correct ?? originalCorrectOf(answer?.correct)
        const score = edit?.score ?? answer?.score ?? 0
        return (
          <div key={question.id}>
            {/* inert：只读复用答题页题卡，屏蔽点击与键盘聚焦（选项是真输入框） */}
            <div inert={true}>
              <QuestionCard
                no={no}
                question={question}
                value={answerMap[question.id] ?? []}
                onChange={noop}
              />
            </div>
            <GradeBar
              question={question}
              maxScore={question.score}
              correct={correct}
              score={score}
              answered={answered}
              onCorrectChange={(next) =>
                answer &&
                onEdit(answer.id, {
                  correct: next,
                  score: next ? question.score : 0,
                })
              }
              onScoreChange={(next) =>
                answer &&
                onEdit(answer.id, { correct: edit?.correct, score: next })
              }
            />
          </div>
        )
      })}
    </>
  )
}
