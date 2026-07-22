// 题目类型
export const QUESTION_TYPES = [
  { value: 'SINGLE_CHOICE', label: '单选题' },
  { value: 'MULTIPLE_CHOICE', label: '多选题' },
  { value: 'JUDGE', label: '判断题' },
  { value: 'TEXT', label: '简答题' },
] as const

// 难度选项
export const DIFFICULTIES = [
  { value: 'EASY', label: '简单' },
  { value: 'MEDIUM', label: '普通' },
  { value: 'HARD', label: '困难' },
] as const

// 题型类型
export type QuestionType = (typeof QUESTION_TYPES)[number]['value']
// 难度类型
export type Difficulty = (typeof DIFFICULTIES)[number]['value']

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
