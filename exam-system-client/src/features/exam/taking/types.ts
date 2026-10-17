import type { ExamTakingView_TargetOf_paper_TargetOf_questions } from '#/__generated/model/static'

/** 答题页里的一道题（= 后端 `ExamTakingView` 的题目，不含正确答案） */
export type ExamQuestion = ExamTakingView_TargetOf_paper_TargetOf_questions

/**
 * 一个可选项。
 *
 * `label` 是给人看的（选项文案），`value` 是**提交给后端的答案值** ——
 * 后端判分比的是 `question_answers.answer`，单选/多选存的是**选项字母**（A/B/C…）、
 * 判断题存 `true`/`false`，所以两者不能混用（见 `optionsOf` / `userAnswerOf`）。
 */
export type ExamOption = {
  label: string
  value: string
}

/**
 * 题号（`questionId`）→ 已选答案。
 *
 * ⚠️ 存的是**答案值**（单选=字母、多选=多个字母、判断=`true`/`false`、简答=原文），
 * 不是给用户看的选项文案 —— 直接拿去拼 `SubmitAnswerReq.userAnswer` 就行。
 *
 * 单选 / 判断 / 简答恒为长度 0 或 1；多选可多值。
 */
export type AnswerMap = Record<number, string[]>