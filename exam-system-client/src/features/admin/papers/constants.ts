// 状态常量
export const PAPER_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  STOPPED: 'STOPPED',
} as const

export const QUESTION_TYPE = {
  CHOICE: 'CHOICE',
  JUDGE: 'JUDGE',
  PUBLISHED: 'PUBLISHED',
} as const

export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE]

export type PaperStatus = (typeof PAPER_STATUS)[keyof typeof PAPER_STATUS]

export const PAPER_STATUS_MAP: Record<
  PaperStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
  }
> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  PUBLISHED: { label: '已发布', variant: 'default' },
  STOPPED: { label: '已停用', variant: 'outline' },
}

// 题目类型
export const QUESTION_TYPE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  CHOICE: { label: '选择题', variant: 'default' },
  JUDGE: { label: '判断题', variant: 'secondary' },
  TEXT: { label: '简答题', variant: 'outline' },
}

// 题目难度
export const QUESTION_DIFFICULTY_MAP: Record<
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
