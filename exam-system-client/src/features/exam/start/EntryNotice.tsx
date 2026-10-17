import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

/** 入口页的琥珀色提示条（「考试未开始」与「需要登录」共用同一套样式） */
export function EntryNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
