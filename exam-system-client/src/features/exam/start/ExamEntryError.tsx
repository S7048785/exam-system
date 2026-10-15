import type { ErrorComponentProps } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'
import { PageShell } from './PageShell.tsx'

/** 试卷信息取不到时的兜底页（不存在 / 未发布 / 已过截止时间，后端都回 422） */
export function ExamEntryError({ error }: ErrorComponentProps) {
  return (
    <PageShell>
      <div className="space-y-3 rounded-lg border p-8 text-center">
        <TriangleAlert className="text-destructive mx-auto size-10" />
        <div className="text-lg font-semibold">无法参加该考试</div>
        <div className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : '考试不存在'}
        </div>
        <div className="text-muted-foreground text-xs">
          请确认链接是否正确，或联系监考老师获取新的考试链接。
        </div>
      </div>
    </PageShell>
  )
}
