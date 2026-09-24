export type PaperPhase = 'draft' | 'notStarted' | 'ongoing' | 'ended'

export const PAPER_PHASE_LABEL: Record<PaperPhase, string> = {
  draft: '草稿',
  notStarted: '未开始',
  ongoing: '进行中',
  ended: '已结束',
}

export const PAPER_PHASE_VARIANT: Record<
  PaperPhase,
  'secondary' | 'outline' | 'warning'
> = {
  draft: 'secondary',
  notStarted: 'outline',
  ongoing: 'warning',
  ended: 'outline',
}

/**
 * 四态由 published + start + end 推导。
 *
 * ⚠️ 判定顺序不能颠倒：必须先判 published，再判 start，最后判 end ——
 * 否则「未开始」会被误判成「进行中」。
 *
 * ℹ️ 起止时间在 1:1 的考试设置表里，理论上不缺失（列 NOT NULL）；这里对缺失做兜底：
 * 没设置就按「未开始」显示。
 */
export function getPaperPhase(
  published: boolean,
  start?: string,
  end?: string
): PaperPhase {
  if (!published) return 'draft'
  if (!start) return 'notStarted'
  const now = Date.now()
  if (now < new Date(start).getTime()) return 'notStarted'
  if (!end) return 'ongoing'
  if (now < new Date(end).getTime()) return 'ongoing'
  return 'ended'
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
