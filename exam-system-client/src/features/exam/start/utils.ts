import z from 'zod'
import type { PaperDto } from '#/__generated/model/dto'
import type { ExamHistoryItemRes } from '#/__generated/model/static'

/** 入口页的试卷：`ExamController.EXAM_ENTRY_INFO` 的取数形状（设置拼在同一条查询里） */
type EntryPaper = PaperDto['ExamController/EXAM_ENTRY_INFO']

/**
 * 考生姓名校验（免登录考试专用）。
 *
 * 对齐后端 `@Size(min = 1, max = 50)`：可空但非空时长度必须是 1~50。
 */
export const studentNameSchema = z
  .string()
  .trim()
  .min(1, '请输入姓名')
  .max(50, '姓名不能超过 50 个字符')

/** 「我」在这张试卷上的状态 */
export type ExamUserState =
  | 'NOT_ATTEMPTED'
  | 'ONGOING'
  | 'RETRYABLE'
  | 'LIMIT_REACHED'

/**
 * 「我」在这张试卷上的状态：
 */
export function resolveExamUserState(
  records: ReadonlyArray<ExamHistoryItemRes>,
  info: EntryPaper,
  now: number,
): ExamUserState {
  const duration = info.examSettings?.duration ?? 0
  const maxAttempts = info.examSettings?.maxAttempts ?? 1
  const end = info.examSettings?.end

  const ongoing = records.find((r) => r.status === 'ONGOING')
  if (ongoing) {
    // 记录缺开始时间就按还在考处理（后端 startTime 是 NOT NULL，这里只是兜底）
    if (!ongoing.startTime) return 'ONGOING'
    const deadline = Math.min(
      new Date(ongoing.startTime).getTime() + duration * 60_000,
      end ? new Date(end).getTime() : Number.POSITIVE_INFINITY,
    )
    if (now < deadline) return 'ONGOING'
  }
  if (records.length === 0) return 'NOT_ATTEMPTED'
  // 超时未交卷的那条也算用过一次（后端按记录数计次数）
  return records.length >= maxAttempts ? 'LIMIT_REACHED' : 'RETRYABLE'
}

/** 试卷的时间窗状态 —— **两个参与模式共用**，只看时间不看「我」的记录 */
export type WindowPhase = 'NOT_STARTED' | 'OPEN' | 'ENDED'

export function resolveWindowPhase(info: EntryPaper, now: number): WindowPhase {
  const start = info.examSettings?.start
  const end = info.examSettings?.end
  if (start && now < new Date(start).getTime()) return 'NOT_STARTED'
  if (end && now > new Date(end).getTime()) return 'ENDED'
  return 'OPEN'
}

/**
 * 账号登录考试的入场状态 = 时间窗 + 「我」的记录。
 *
 * ⚠️ **免登录考试不要用这个**：那条路径拿不到历史记录（`examHistory` 要求登录），
 * 前端无法识别「我」考到哪一步，只用 {@link WindowPhase} 就够
 * （免登录考试永远不显示「继续考试」）。
 */
export type EntryPhase =
  | 'NOT_STARTED'
  | 'NEED_LOGIN'
  | 'READY'
  | 'RETRY'
  | 'ONGOING'
  | 'LIMIT_REACHED'
  | 'FINISHED'

export function resolveEntryPhase(
  info: EntryPaper,
  loggedIn: boolean,
  records: ReadonlyArray<ExamHistoryItemRes>,
  now: number,
): EntryPhase {
  const window = resolveWindowPhase(info, now)
  if (window === 'NOT_STARTED') return 'NOT_STARTED'
  // 整场窗口结束优先于次数：场次截止了，剩几次都不能进
  if (window === 'ENDED') return 'FINISHED'
  if (!loggedIn) return 'NEED_LOGIN'
  switch (resolveExamUserState(records, info, now)) {
    case 'NOT_ATTEMPTED':
      return 'READY'
    case 'ONGOING':
      return 'ONGOING'
    case 'RETRYABLE':
      return 'RETRY'
    case 'LIMIT_REACHED':
      return 'LIMIT_REACHED'
  }
}
