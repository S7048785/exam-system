export type PaperPhase = 'ongoing' | 'ended'

export const PAPER_PHASE_LABEL: Record<PaperPhase, string> = {
  ongoing: '进行中',
  ended: '已结束',
}

export const PAPER_PHASE_VARIANT: Record<PaperPhase, 'warning' | 'outline'> = {
  ongoing: 'warning',
  ended: 'outline',
}

export function getPaperPhase(end: string): PaperPhase {
  return Date.now() < new Date(end).getTime() ? 'ongoing' : 'ended'
}

// 题目类型
export const QUESTION_TYPE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  SINGLE_CHOICE: { label: '单选题', variant: 'default' },
  MULTIPLE_CHOICE: { label: '多选题', variant: 'default' },
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
