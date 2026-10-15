import { useQuery } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import { orderQuestionsByType } from '#/features/exam/paper/utils.ts'
import { answersOf } from './utils.ts'
import type { DetailAnswerRecord, DetailQuestion } from './utils.ts'
import type { AnswerMap } from '#/features/exam/paper/types.ts'
import type { ExamRecordDetail } from '#/__generated/model/static'

/** `useScoreDetail` 的返回值：两个弹窗把它整体透传给 {@link ScoreDialogShell}，避免拆成一堆 props */
export interface ScoreDetailScope {
  detail: ExamRecordDetail | undefined
  questions: ReadonlyArray<DetailQuestion>
  answerRecords: ReadonlyArray<DetailAnswerRecord>
  /** 按题型排好序的题目（含题号） */
  ordered: ReadonlyArray<{ no: number; question: DetailQuestion }>
  /** `questionId → 题卡要的选项值` */
  answerMap: AnswerMap
  /** `questionId → 库里的答案行` */
  answerByQuestion: ReadonlyMap<number, DetailAnswerRecord>
  /** 左侧答题卡的着色依据（`questionId → 对/错`） */
  results: Record<number, 'correct' | 'wrong'>
  isFetching: boolean
  error: unknown
}

/**
 * 「成绩详情」与「考试评分」两个弹窗共用的取数 + 派生。
 *
 * 数据源 `GET /exams/records/{recordId}/detail`（控制台侧，后端按**试卷作者**校验归属，
 * 且与考生侧一样**拦 ONGOING** —— 所以列表里「考试中」的行按钮是禁用的）。
 */
export function useScoreDetail(
  recordId: string | undefined,
  enabled: boolean,
): ScoreDetailScope {
  const { data, isFetching, error } = useQuery({
    queryKey: ['examRecordDetail', recordId],
    queryFn: () => api.examController.getRecordDetail({ recordId: recordId! }),
    // 没有行数据就不发请求；「考试中」的行不会走到这里（按钮已禁用 + 后端也拦）
    enabled: enabled && !!recordId,
    staleTime: 30 * 1000,
  })
  const detail = data?.data

  const questions = detail?.paper.questions ?? []
  const answerRecords = detail?.answerRecords ?? []
  const ordered = orderQuestionsByType(questions)
  const answerMap = answersOf(questions, answerRecords)
  const answerByQuestion = new Map(
    answerRecords.map((answer) => [answer.questionId, answer]),
  )

  /**
   * 左侧答题卡的着色依据（`questionId → 对/错`）。
   *
   * - 只收**客观题**：简答题后端不自动判分（老数据里 `correct` 是 0），参与着色会整片标红；
   * - 题目已删的孤儿答案跳过；
   * - `correct` 为 null 的（未批改）不下结论，格子保持中性。
   */
  const questionById = new Map(
    questions.map((question) => [question.id, question]),
  )
  const results: Record<number, 'correct' | 'wrong'> = {}
  for (const answer of answerRecords) {
    const question = questionById.get(answer.questionId)
    if (!question || question.type === 'TEXT') continue
    if (answer.correct === 1) {
      results[answer.questionId] = 'correct'
    } else if (answer.correct === 0) {
      results[answer.questionId] = 'wrong'
    }
  }

  return {
    detail,
    questions,
    answerRecords,
    ordered,
    answerMap,
    answerByQuestion,
    results,
    isFetching,
    error,
  }
}
