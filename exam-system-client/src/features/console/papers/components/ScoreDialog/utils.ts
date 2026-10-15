import type {
  ExamRecordDetail_TargetOf_answerRecords,
  ExamRecordDetail_TargetOf_paper_TargetOf_questions,
  GradeAnswerReq,
} from '#/__generated/model/static'
import type { QuestionType } from '#/__generated/model/enums'
import type { AnswerMap } from '#/features/exam/paper/types.ts'

export type DetailQuestion = ExamRecordDetail_TargetOf_paper_TargetOf_questions
export type DetailAnswerRecord = ExamRecordDetail_TargetOf_answerRecords

/** 未提交的编辑（`answerRecordId` → 改动）；**只存动过的题**，提交时也只下发这些 */
export type EditMap = Record<number, { correct?: boolean; score: number }>

/** 题卡是只读的，交互回调给个空实现（外面又套了 `inert`，点不动） */
export const noop = () => {}

/**
 * 判断题的历史数据里既有 `true/false`（现口径）也有 `T/F`（老数据），
 * 统一归一化后才能和 `optionsOf` 给出的 `true/false` 对上，否则老记录会渲染成「未作答」。
 */
export function normalizeJudge(
  value?: string | null,
): 'true' | 'false' | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (v === 'true' || v === 't') return 'true'
  if (v === 'false' || v === 'f') return 'false'
  return undefined
}

/**
 * 把库里的 `userAnswer` 转成题卡要的 `value: string[]`。
 *
 * 🔴 口径必须与 `optionsOf` 产出的 `value` 对齐：选择题是**选项字母**（按 `sort` 排完序的下标），
 * 判断题是 `true`/`false` —— 直接拿原始 `userAnswer` 塞进去，判断题会永远显示未选。
 *
 * 题目已被删除的「孤儿答案」（其 `questionId` 不在本卷题目里）直接跳过。
 */
export function answersOf(
  questions: ReadonlyArray<{ id: number; type: QuestionType }>,
  records: ReadonlyArray<{ questionId: number; userAnswer: string }>,
): AnswerMap {
  const typeById = new Map(questions.map((q) => [q.id, q.type]))
  const answers: AnswerMap = {}
  for (const record of records) {
    const type = typeById.get(record.questionId)
    if (type === undefined) continue
    if (type === 'MULTIPLE_CHOICE') {
      answers[record.questionId] = record.userAnswer
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    } else if (type === 'JUDGE') {
      const normalized = normalizeJudge(record.userAnswer)
      answers[record.questionId] = normalized ? [normalized] : []
    } else {
      answers[record.questionId] = [record.userAnswer]
    }
  }
  return answers
}

/** 标准答案文案：选择题显示字母、判断题显示「正确/错误」 */
export function correctAnswerText(question: {
  type: QuestionType
  answer: string
}): string {
  if (question.type === 'JUDGE') {
    const normalized = normalizeJudge(question.answer)
    if (!normalized) return '—'
    return normalized === 'true' ? '正确' : '错误'
  }
  return question.answer ? question.answer.toUpperCase() : '—'
}

/** 库里的 `is_correct`（tinyint）→ 判对/判错；`null`/其他值 = 还没判，返回 undefined */
export function originalCorrectOf(correct?: number): boolean | undefined {
  if (correct === 1) return true
  if (correct === 0) return false
  return undefined
}

/** 题目列表为空时的文案：先报错，再加载中，最后「暂无作答记录」 */
export function emptyTextOf(error: unknown, isFetching: boolean): string {
  if (error) return error instanceof Error ? error.message : '加载失败'
  return isFetching ? '加载中…' : '暂无作答记录'
}

/**
 * 把编辑态收敛成提交体：**只保留与库里有差异的项**（没动过的题不下发，
 * 免得把老师没看的题也重写一遍）。
 *
 * `correct` 仍可能是 undefined —— 表示库里没判过、老师也没点，调用方据此提示「还有 N 题没选」。
 */
export function buildChangedAnswers(
  records: ReadonlyArray<DetailAnswerRecord>,
  edits: EditMap,
): GradeAnswerReq[] {
  const changed: GradeAnswerReq[] = []
  for (const answer of records) {
    const edit = edits[answer.id]
    if (!edit) continue
    const originalCorrect = originalCorrectOf(answer.correct)
    const scoreChanged = edit.score !== (answer.score ?? 0)
    const correctChanged =
      edit.correct !== undefined && edit.correct !== originalCorrect
    if (!scoreChanged && !correctChanged) continue
    changed.push({
      answerRecordId: answer.id,
      // 库里判过的沿用原值；库里没判过的必须由老师点一下（提交前拦）
      correct: edit.correct ?? originalCorrect,
      score: edit.score,
    })
  }
  return changed
}
