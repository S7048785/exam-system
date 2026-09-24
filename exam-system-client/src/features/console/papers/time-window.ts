/**
 * 考试时间窗的取值转换。
 * 后端 `PaperExamSettingsInput.start` / `end` 是 `LocalDateTime`（必填），
 * 前端用 `<input type="datetime-local">`，值是 `YYYY-MM-DDTHH:mm`（不带秒）。
 */

/** datetime-local 的值（YYYY-MM-DDTHH:mm）→ 后端要的 LocalDateTime（补秒） */
export const toApiDateTime = (v: string) => (v.length === 16 ? `${v}:00` : v)

/** 后端返回的 ISO 串 → datetime-local 的值 */
export const toLocalInput = (v: string | undefined | null) =>
  v ? v.slice(0, 16) : ''

/** 默认时间窗：现在 ~ 7 天后 */
export const defaultTimeWindow = () => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  const now = new Date()
  return {
    start: fmt(now),
    end: fmt(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
  }
}
