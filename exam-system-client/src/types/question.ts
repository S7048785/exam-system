import type {
  QuestionDifficulty,
  QuestionType,
} from '#/__generated/model/enums'

/**
 * 题型 / 难度的中文文案，纯 UI 数据（label、badge 样式）。
 *
 * ⚠️ `QuestionType` / `QuestionDifficulty` 这两个**类型**生成代码里就有
 * （`#/__generated/model/enums`），本文件不再手写一份 —— 之前这里重复定义过。
 * 用 `satisfies` 收口：既能校验枚举值没写错，又保留 `as const` 的字面量类型。
 */

// 题目类型选项
export const QUESTION_TYPES = [
  { value: 'SINGLE_CHOICE', label: '单选题' },
  { value: 'MULTIPLE_CHOICE', label: '多选题' },
  { value: 'JUDGE', label: '判断题' },
  { value: 'TEXT', label: '简答题' },
] as const satisfies readonly { value: QuestionType; label: string }[]

// 难度选项
export const DIFFICULTIES = [
  { value: 'EASY', label: '简单' },
  { value: 'MEDIUM', label: '普通' },
  { value: 'HARD', label: '困难' },
] as const satisfies readonly { value: QuestionDifficulty; label: string }[]

// 题型映射
export const TYPE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  SINGLE_CHOICE: { label: '单选题', variant: 'default' },
  MULTIPLE_CHOICE: { label: '多选题', variant: 'default' },
  JUDGE: { label: '判断题', variant: 'secondary' },
  TEXT: { label: '简答题', variant: 'outline' },
}

// 难度映射
export const DIFFICULTY_MAP: Record<
  string,
  { label: string; className: string }
> = {
  EASY: {
    label: '简单',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  MEDIUM: {
    label: '普通',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  HARD: {
    label: '困难',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
}
