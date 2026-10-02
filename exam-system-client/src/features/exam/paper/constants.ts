import type { QuestionType } from '#/__generated/model/enums'

/**
 * 题型的展示信息。
 *
 * `multiple` 决定渲染成 checkbox 还是 radio（`TEXT` 走文本域，用不到）。
 */
export const QUESTION_TYPE_META: Record<
  QuestionType,
  { label: string; hint: string; multiple: boolean }
> = {
  SINGLE_CHOICE: { label: '单选题', hint: '请选择一项', multiple: false },
  MULTIPLE_CHOICE: {
    label: '多选题',
    hint: '请选择所有正确项',
    multiple: true,
  },
  JUDGE: { label: '判断题', hint: '请判断正误', multiple: false },
  TEXT: { label: '简答题', hint: '请在下方输入你的作答', multiple: false },
}

/**
 * 题型展示顺序：单选 → 判断 → 多选 → 简答。
 *
 * 中间题目列表与左侧答题卡都按这个顺序分组排列（见 `groupQuestionsByType`），
 * **不要随手改**——改了题目顺序就跟着变。
 */
export const QUESTION_TYPE_ORDER: QuestionType[] = [
  'SINGLE_CHOICE',
  'JUDGE',
  'MULTIPLE_CHOICE',
  'TEXT',
]
