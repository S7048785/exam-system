import { QuestionCard } from '#/features/exam/taking/components/QuestionCard.tsx'
import { ReviewBar } from './ReviewBar.tsx'
import { noop } from './utils.ts'
import type { DetailAnswerRecord, DetailQuestion } from './utils.ts'
import type { AnswerMap } from '#/features/exam/taking/types.ts'

interface DetailQuestionListProps {
  /** 已按题型排好序的题目（题号也在这里） */
  ordered: ReadonlyArray<{ no: number; question: DetailQuestion }>
  /** `questionId → 题卡要的选项值` */
  answerMap: AnswerMap
  /** `questionId → 库里的答案行` */
  answerByQuestion: ReadonlyMap<number, DetailAnswerRecord>
  /** 题目为空时显示的文案（加载中 / 报错 / 暂无） */
  emptyText: string
  /** 每题下方是否显示题目解析（考生侧「查看答案解析」传 true，控制台不传） */
  showAnalysis?: boolean
}

/**
 * **查看成绩**用的逐题列表：只读。
 *
 * 只读复用答题页的题卡（外面套 `inert` 关掉交互），下面贴一条批改结果 `ReviewBar`
 * —— 得分与对错取库里的值，前端不重算。
 */
export function DetailQuestionList({
  ordered,
  answerMap,
  answerByQuestion,
  emptyText,
  showAnalysis = false,
}: DetailQuestionListProps) {
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
            <ReviewBar
              question={question}
              answer={answer?.userAnswer || ''}
              score={answer?.score}
              correct={answer?.correct}
              answered={answered}
              analysis={showAnalysis ? question.analysis : undefined}
            />
          </div>
        )
      })}
    </>
  )
}
