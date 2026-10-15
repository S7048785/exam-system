import { QUESTION_TYPE_ORDER } from '#/features/exam/paper/constants.ts'
import type {
  AnswerMap,
  ExamOption,
  ExamQuestion,
} from '#/features/exam/paper/types.ts'
import type { SubmitAnswerReq } from '#/__generated/model/static'
import { useEffect, useState } from 'react'

/** 有内容才算「已作答」（纯空白不算） */
export function isAnswered(value: string[] | undefined): boolean {
  return !!value && value.some((item) => item.trim() !== '')
}

/** 已作答题数 */
export function countAnswered(
  questions: ReadonlyArray<ExamQuestion>,
  answers: AnswerMap,
): number {
  return questions.filter((question) => isAnswered(answers[question.id])).length
}

/** 选项序号：0 → A、1 → B…… */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

/**
 * 题目的可选项：`label` 给人看，`value` 交卷。
 *
 * - 选择题：**先按 `sort` 排回出题时的顺序**，序号即选项字母（A/B/C…）。后端写标准答案用的是
 *   提交时的下标（`QuestionService.processChoice` 里 `(char)('A' + i)`），而 `question_choices`
 *   的取数顺序没有 `ORDER BY` 保证 ⇒ 不排的话选项字母可能错位，考生选 B 后端却按 A 判分。
 * - 判断题：后端**不给 choices**（`QuestionService.buildSaveInput` 里 JUDGE 只写 answers），
 *   这里兜底成「正确 / 错误」，值必须是 `true` / `false`（后端就按这个比）。
 */
export function optionsOf(question: ExamQuestion): ExamOption[] {
  if (question.type === 'JUDGE') {
    return [
      { label: '正确', value: 'true' },
      { label: '错误', value: 'false' },
    ]
  }
  return [...question.choices]
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((choice, index) => ({
      label: choice.content,
      value: optionLetter(index),
    }))
}

/**
 * 把某一题的已选答案拼成后端要的 `userAnswer`：
 *
 * - 多选 → 逗号连接（后端 `split(",")` 后按 Set 比较，**与顺序无关**；这里排一下只为让落库值稳定）
 * - 单选 / 判断 / 简答 → 取第一个（没有就返回空串）
 */
export function userAnswerOf(question: ExamQuestion, values: string[]): string {
  if (question.type === 'MULTIPLE_CHOICE') {
    return [...values].sort().join(',')
  }
  return values[0] ?? ''
}

/**
 * 组装保存 / 交卷的请求体。全量覆盖
 * 「请求体里没有」就等于「这题没答」，于是「把多选题的选项全部取消勾选再保存」也能真正生效。
 */
export function toSubmitAnswers(
  questions: ReadonlyArray<ExamQuestion>,
  answers: AnswerMap,
): SubmitAnswerReq[] {
  return questions
    .filter((question) => isAnswered(answers[question.id]))
    .map((question) => ({
      questionId: question.id,
      userAnswer: userAnswerOf(question, answers[question.id] ?? []),
    }))
}

/**
 * 把后端回传的已存答案（`ExamTakingView.answerRecords`）转成界面用的 `AnswerMap` ——
 * 「继续考试」进页面时把上次的勾选状态恢复出来。
 */
export function answerRecordsToMap(
  questions: ReadonlyArray<ExamQuestion>,
  records: ReadonlyArray<{ questionId: number; userAnswer: string }>,
): AnswerMap {
  const typeById = new Map(
    questions.map((question) => [question.id, question.type]),
  )
  const answers: AnswerMap = {}
  for (const record of records) {
    answers[record.questionId] =
      typeById.get(record.questionId) === 'MULTIPLE_CHOICE'
        ? record.userAnswer.split(',')
        : [record.userAnswer]
  }
  return answers
}

/** 毫秒 → `mm:ss` / `hh:mm:ss` */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`
}

/**
 * 按题型分组并排序（顺序见 `QUESTION_TYPE_ORDER`：单选 → 判断 → 多选 → 简答）。
 */
export function groupQuestionsByType<T extends ExamQuestion>(
  questions: ReadonlyArray<T>,
) {
  const groups = QUESTION_TYPE_ORDER.map((type) => ({
    type,
    questions: questions.filter((question) => question.type === type),
  })).filter((group) => group.questions.length > 0)

  let no = 0
  return groups.map((group) => ({
    type: group.type,
    items: group.questions.map((question) => {
      no += 1
      return { no, question }
    }),
  }))
}

/** 把分组结果拍平成一条有序题目列表（题号已经算好） */
export function orderQuestionsByType<T extends ExamQuestion>(
  questions: ReadonlyArray<T>,
) {
  return groupQuestionsByType(questions).flatMap((group) => group.items)
}

/** `ApiError.message` 就是后端的业务文案（422 是 text/plain，5xx 也有），拿不到才用 fallback */
export const errorText = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

/**
 * 每秒走一次的倒计时，返回距 `deadline` 还剩多少毫秒。
 *
 * 初始值是 `null`（未挂载）：服务端渲染时拿不到客户端时间，直接算会在 hydration 时报
 * 「文本不一致」；所以调用方先渲染一个占位符（`--:--`），等挂载后再开始跳动。
 */
export function useCountdown(deadline: number): number | null {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  return now === null ? null : deadline - now
}