/**
 * 将 ISO 8601 格式的日期时间字符串转换为 'YYYY-MM-DD' 格式
 * @param {string} datetimeStr - 日期时间字符串，如 '2025-07-30T10:52:25'
 * @returns {string} 格式化后的日期字符串，如 '2025-07-30'
 */
export function formatDate(datetimeStr: string) {
  const date = new Date(datetimeStr)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    throw new Error('无效的日期格式')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 将 ISO 8601 日期字符串格式化为 'YYYY-MM-DD HH:mm'
 * @param {string} datetimeStr - 如 '2026-07-08T18:38:56'
 * @returns {string} 如 '2026-07-08 18:38'
 */
export function formatDateTime(datetimeStr: string) {
  const date = new Date(datetimeStr)

  if (isNaN(date.getTime())) {
    throw new Error('无效的日期格式')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 测试
console.log(formatDateTime('2026-07-08T18:38:56'))
// 输出: "2026-07-08 18:38"
