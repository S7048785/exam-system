import { useEffect, useState } from 'react'

/**
 * 会自己走的「当前时刻」。
 *
 * 入口页要守着 start / end（以及续考的作答时限）这几个时刻。只在渲染时取一次
 * `Date.now()` 的话，到点不会重算 —— 「考试未开始」的页面过了开考时刻不会自动亮，
 * 到截止时刻按钮也不会自动变灰。
 *
 * 前提：所在页面是 **`ssr: false`**（入口页已关 SSR），初始值在渲染期直接取即可，
 * 不存在服务端 / 客户端两套时间造成的 hydration 不一致。若将来改回 SSR，
 * 这里要换成 `useCountdown` 那种「挂载后再取值」的写法。
 *
 * @param marks 需要重算的时刻（毫秒时间戳），如试卷 start / end、续考截止时间
 */
export function useNow(marks: ReadonlyArray<number>): number {
  const [now, setNow] = useState(() => Date.now())

  // marks 每次渲染都是新数组，用拼接串做依赖，避免无谓重跑
  const key = marks.join('|')

  useEffect(() => {
    const upcoming = key
      .split('|')
      .map(Number)
      .filter((time) => Number.isFinite(time) && time > Date.now())
      .sort((a, b) => a - b)

    // 关键时刻都过去了 → 页面状态已经定型，不再空转
    if (upcoming.length === 0) return undefined

    // 到点醒一次；上限 30s 是对抗后台标签页的定时器节流，否则可能晚很久才纠正回来
    const delay = Math.min(upcoming[0] - Date.now() + 50, 30_000)
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, delay),
    )
    return () => window.clearTimeout(timer)
  }, [key, now])

  return now
}
