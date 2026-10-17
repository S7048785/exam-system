import type { ReactNode } from 'react'
import { cn } from '#/lib/utils.ts'

export type StatChipTone = 'default' | 'danger' | 'success'

/** 顶栏右上角的一格统计（倒计时 / 题目数量 / 已作答） */
export function StatChip({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: StatChipTone
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border px-3 py-1.5',
        tone === 'danger' && 'border-destructive/40 bg-destructive/5',
        tone === 'success' && 'border-emerald-500/40 bg-emerald-500/5',
      )}
    >
      <span
        className={cn(
          'text-muted-foreground',
          tone === 'danger' && 'text-destructive',
          tone === 'success' && 'text-emerald-500',
        )}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-muted-foreground text-[11px]">{label}</div>
        <div
          className={cn(
            'text-sm font-semibold tabular-nums',
            tone === 'danger' && 'text-destructive',
            tone === 'success' && 'text-emerald-500',
          )}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
