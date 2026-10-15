import type { ExamRecordStatus } from '#/__generated/model/enums'

/**
 * 后端 `ExamRecordStatus` 三态 → 展示文案与配色。
 *
 * 成绩列表 / 成绩详情 / 评分三个弹窗共用，避免同一套文案写两遍。
 *
 * ⚠️ `GRADING` 是**等待人工批改**（卷面含简答题，交卷时只自动判了客观题），不是「AI 批改中」。
 */
export const EXAM_RECORD_STATUS_MAP: Record<
  ExamRecordStatus,
  { label: string; variant: 'warning' | 'outline' | 'secondary' }
> = {
  ONGOING: { label: '考试中', variant: 'warning' },
  GRADING: { label: '待批改', variant: 'outline' },
  GRADED: { label: '已批改', variant: 'secondary' },
}

/** 考试中的记录**不给看答题详情**（后端也拦），列表里按钮据此置灰 */
export const canViewRecordDetail = (status: ExamRecordStatus) =>
  status !== 'ONGOING'
