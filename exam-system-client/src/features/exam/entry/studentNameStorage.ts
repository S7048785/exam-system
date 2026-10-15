/**
 * 考生姓名本地记忆（**免登录考试**专用）。
 *
 * 免登录考试的姓名是考生手填的，同一个人参加多场免登录考试没必要每场都重打一遍：
 * 点「开始考试」时记到 localStorage，下次再进免登录考试的入口页自动填入。
 */

const STUDENT_NAME_KEY = 'exam-student-name'

/**
 * 读取上次记住的考生姓名；没存过 / 隐私模式下不可用 → 空串。
 *
 * 注意：SSR 阶段没有 `localStorage`，这里靠 try/catch 兜底返回空串（调用方
 * 不要再自己判 `typeof window`）。
 */
export function getSavedStudentName(): string {
  try {
    return localStorage.getItem(STUDENT_NAME_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

/** 记住考生姓名（「开始考试」时调用） */
export function saveStudentName(name: string): void {
  try {
    localStorage.setItem(STUDENT_NAME_KEY, name)
  } catch {
    // 隐私模式 / 配额满 → 静默降级，绝不因为存不上而拦住开考
  }
}
