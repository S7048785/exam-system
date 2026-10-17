import z from 'zod'
import type { Dynamic_ExamRecords } from '#/__generated/model/dynamic'
import type { ExamPaperInfoRes } from '#/__generated/model/static'

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
export type ExamUserState = 'NOT_ATTEMPTED' | 'ONGOING' | 'FINISHED'

/**
 * 「我」在这张试卷上的状态：
 * - 一条记录都没有 → 未考试
 * - 有 `ONGOING` 记录且还在作答时限内 → 考试中（按钮切「继续考试」）
 * - 其余（已交卷，或 `ONGOING` 但已超时）→ 考试结束
 *
 * 时限取 `min(记录开始时间 + 试卷时长, 试卷截止时间)`：前者是**单场作答时长**，
 * 后者是**整场窗口** —— 窗口到点后谁都不能再考，手里那条 ONGOING 也不放行。
 */
export function resolveExamUserState(
  records: ReadonlyArray<Dynamic_ExamRecords>,
  info: ExamPaperInfoRes,
  now: number,
): ExamUserState {
  const ongoing = records.find((r) => r.status === 'ONGOING')
  if (!ongoing) {
    return records.length > 0 ? 'FINISHED' : 'NOT_ATTEMPTED'
  }
  // 记录缺开始时间就按还在考处理（后端 startTime 是 NOT NULL，这里只是兜底）
  if (!ongoing.startTime) return 'ONGOING'
  const deadline = Math.min(
    new Date(ongoing.startTime).getTime() + info.duration * 60_000,
    new Date(info.end).getTime(),
  )
  return now >= deadline ? 'FINISHED' : 'ONGOING'
}

/** 试卷的时间窗状态 —— **两个参与模式共用**，只看时间不看「我」的记录 */
export type WindowPhase = 'NOT_STARTED' | 'OPEN' | 'ENDED'

export function resolveWindowPhase(
  info: ExamPaperInfoRes,
  now: number,
): WindowPhase {
  if (now < new Date(info.start).getTime()) return 'NOT_STARTED'
  if (now > new Date(info.end).getTime()) return 'ENDED'
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
  | 'ONGOING'
  | 'FINISHED'

export function resolveEntryPhase(
  info: ExamPaperInfoRes,
  loggedIn: boolean,
  records: ReadonlyArray<Dynamic_ExamRecords>,
  now: number,
): EntryPhase {
  const window = resolveWindowPhase(info, now)
  if (window === 'NOT_STARTED') return 'NOT_STARTED'
  if (window === 'ENDED') return 'FINISHED'
  if (!loggedIn) return 'NEED_LOGIN'
  // 剩下三态与 ExamUserState 同名，未考过即「可以开考」
  const state = resolveExamUserState(records, info, now)
  return state === 'NOT_ATTEMPTED' ? 'READY' : state
}
