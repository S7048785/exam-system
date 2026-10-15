function format(datetimeStr: string) {
  const date = new Date(datetimeStr)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    throw new Error('无效的日期格式')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return [year, month, day, hours, minutes]
}
/**
 * 将 ISO 8601 格式的日期时间字符串转换为 'YYYY-MM-DD' 格式
 * @param {string} datetimeStr - 日期时间字符串，如 '2025-07-30T10:52:25'
 * @returns {string} 格式化后的日期字符串，如 '2025-07-30'
 */

export function formatDate(datetimeStr: string) {
  const [year, month, day] = format(datetimeStr)
  return `${year}-${month}-${day}`
}

/**
 * 将 ISO 8601 日期字符串格式化为 'YYYY-MM-DD HH:mm'
 * @param {string} datetimeStr - 如 '2026-07-08T18:38:56'
 * @returns {string} 如 '2026-07-08 18:38'
 */
export function formatDateTime(datetimeStr: string) {
  const [year, month, day, hours, minutes] = format(datetimeStr)
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 将 ISO 8601 日期字符串格式化为 'MM-DD HH:mm'（省掉年份）。
 * 用于「开始 ~ 交卷」并排放在同一列的场景：年份重复且挤，短格式更清爽。
 * @param {string} datetimeStr - 如 '2026-09-30T16:23:00'
 * @returns {string} 如 '09-30 16:23'
 */
export function formatDateTimeShort(datetimeStr: string) {
  const [, month, day, hours, minutes] = format(datetimeStr)
  return `${month}-${day} ${hours}:${minutes}`
}

// 测试
// console.log(formatDateTime('2026-07-08T18:38:56'))
// 输出: "2026-07-08 18:38"

/**
 * 用时秒数 →「X分Y秒」。
 * 后端对**未交卷**（考试中 / 无交卷时间）的记录直接给 0，这里只需防御性兜底。
 */
export function formatUsedTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  return `${Math.floor(safe / 60)}分${safe % 60}秒`
}
