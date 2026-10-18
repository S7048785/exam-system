import { Badge } from '#/components/ui/badge.tsx'
import { correctAnswerText } from './utils.ts'
import type { QuestionType } from '#/__generated/model/enums'

/**
 * 题卡下方贴着的一条「批改结果」（只读）。
 *
 * ⚠️ 题卡（答题页复用）不显示对错，所以得分与对错**一律取库里 `answer_record` 的值，前端不重算**
 * —— 历史数据里标准答案被改过（考生答 `T` 却得了满分），重算会自相矛盾。
 *
 * 传了 `analysis` 就在下面多贴一行题目解析 —— 只有考生结果页的「查看答案解析」会传，控制台不传。
 */
export function ReviewBar({
  question,
  score,
  correct,
  answered,
  answer,
  analysis,
}: {
  question: { id: number; type: QuestionType; score: number }
  answer: string
  score?: number
  correct?: number
  answered: boolean
  /** 题目解析（可为空，空则不显示这一行） */
  analysis?: string
}) {
  // 简答题后端不自动判分；老数据里它的 score 是 0，直接显示会误导成「得了 0 分」
  if (question.type === 'TEXT') {
    return (
      <div className="bg-muted/40 flex flex-wrap items-center gap-2 border border-t-0 px-5 py-2.5 text-xs shadow-sm">
        <span className="text-muted-foreground">
          {answered ? '简答题由人工批改，不在此自动判分' : '未作答'}
        </span>
        <AnalysisLine analysis={analysis} />
      </div>
    )
  }
  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-1 border border-t-0 px-5 py-2.5 text-xs shadow-sm">
      <span className="text-muted-foreground">
        标准答案：
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          {correctAnswerText({ type: question.type, answer: answer })}
        </span>
      </span>
      <span className="text-muted-foreground ml-auto">
        得分 <span className="text-foreground font-semibold">{score ?? 0}</span>{' '}
        / {question.score}
      </span>
      {!answered ? (
        <Badge variant="outline">未作答</Badge>
      ) : (
        <Badge variant={correct === 1 ? 'secondary' : 'destructive'}>
          {correct === 1 ? '答对' : '答错'}
        </Badge>
      )}
      <AnalysisLine analysis={analysis} />
    </div>
  )
}

/** 题目解析：没录解析时整行不渲染（不占位，也不留空边框） */
function AnalysisLine({ analysis }: { analysis?: string }) {
  const text = analysis?.trim()
  if (!text) return null
  return (
    <div className="text-muted-foreground mt-1 w-full border-t pt-2 leading-relaxed">
      <span className="text-foreground font-medium">解析：</span>
      <span className="whitespace-pre-wrap">{text}</span>
    </div>
  )
}
