import { useEffect, useState } from 'react'

/**
 * 每秒走一次的倒计时，返回距 `deadline` 还剩多少毫秒。
 *
 * 初始值是 `null`（未挂载）：服务端渲染时拿不到客户端时间，直接算会在 hydration 时报
 * 「文本不一致」；所以调用方先渲染一个占位符（`--:--`），等挂载后再开始跳动。
 */
export function useCountdown(deadline: number): number | null {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  return now === null ? null : deadline - now
}
