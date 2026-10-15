import type { PopoverSelectOption } from '#/components/popover-select/PopoverSelect.tsx'
import type { ExamRecordStatus } from '#/__generated/model/enums'
import { EXAM_RECORD_STATUS_MAP } from '#/features/console/papers/list/examRecordConstants.ts'

/** 状态筛选项 —— 标签复用共用的状态文案表，避免同一套中文写两遍 */
export const STATUS_FILTER_OPTIONS: ReadonlyArray<
  PopoverSelectOption<ExamRecordStatus>
> = [
  { value: 'ONGOING', label: EXAM_RECORD_STATUS_MAP.ONGOING.label },
  { value: 'GRADING', label: EXAM_RECORD_STATUS_MAP.GRADING.label },
  { value: 'GRADED', label: EXAM_RECORD_STATUS_MAP.GRADED.label },
]

/**
 * 「是否及格」筛选的载体值。
 */
export type PassFilter = 'PASS' | 'FAIL'

export const PASS_FILTER_OPTIONS: ReadonlyArray<
  PopoverSelectOption<PassFilter>
> = [
  { value: 'FAIL', label: '未及格' },
  { value: 'PASS', label: '及格' },
]

/**
 * 统计卡图标的颜色（浅色 / 深色各一档），纯装饰 —— 按语义给色，
 */
export const STAT_ICON_TONE = {
  people: 'text-blue-600 dark:text-blue-400',
  pass: 'text-emerald-600 dark:text-emerald-400',
  fail: 'text-rose-600 dark:text-rose-400',
  max: 'text-amber-600 dark:text-amber-400',
  avg: 'text-violet-600 dark:text-violet-400',
  min: 'text-cyan-600 dark:text-cyan-400',
} as const
