import type { ReactNode } from 'react'

type InfoTileType = {
  icon: ReactNode
  label: string
  value: ReactNode
}

/** 试卷信息的一格（图标 + 标签 + 值），入口页右边那三块「考试时间 / 时长 / 总分」用的 */
export function InfoTile({ icon, label, value }: InfoTileType) {
  return (
    <div className="bg-muted/50 flex items-start gap-3 rounded-lg px-3 py-2.5">
      <div className="text-primary mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}
