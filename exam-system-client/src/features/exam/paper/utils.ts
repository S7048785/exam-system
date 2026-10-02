import { QUESTION_TYPE_ORDER } from '#/features/exam/paper/constants.ts'
import type {
  AnswerMap,
  ExamOption,
  ExamQuestion,
} from '#/features/exam/paper/types.ts'
import type { SubmitAnswerReq } from '#/__generated/model/static'

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
 * 组装保存 / 交卷的请求体。
 *
 * 🔴 后端 `saveAnswers` 是**全量覆盖**（先删掉这场考试的全部答案，再按请求体整份重建），
 * 所以请求体必须等于**整份答卷** —— 只传改动的那几题会把其余答案全清掉。
 *
 * 这里刻意**不带未作答的题**（顺带也避开了 `userAnswer` 的 `@NotBlank`）：后端删完重建之后，
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
 *
 * ⚠️ 只按**题型**决定要不要拆逗号：多选的答案本来就是 `A,C` 这种形式，而简答题原文里完全
 * 可能有半角逗号，无脑 `split(',')` 会在下次保存时把答案截断。
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
 *
 * 题号按**分组后的顺序**在整卷内连续编号（不按题型重新从 1 开始），同题型内部保持题目
 * 原有的相对顺序。中间题目列表和左侧答题卡都吃这一份结果，保证「列表里的第 N 题」
 * 和「答题卡上的 N」永远是同一题。
 */
export function groupQuestionsByType(questions: ReadonlyArray<ExamQuestion>) {
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
export function orderQuestionsByType(questions: ReadonlyArray<ExamQuestion>) {
  return groupQuestionsByType(questions).flatMap((group) => group.items)
}
