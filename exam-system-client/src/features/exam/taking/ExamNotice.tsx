import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button.tsx'

/** 兜底页：缺记录 / 加载失败 / 已交卷，统一说明 + 一个回入口的出口 */
export function ExamNotice({
  title,
  description,
  paperId,
}: {
  title: string
  description: string
  paperId: string
}) {
  return (
    <div className="bg-background flex h-screen items-center justify-center p-6">
      <div className="bg-card w-full max-w-md space-y-4 border p-8 text-center shadow-xl">
        <div className="text-lg font-semibold">{title}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
        <Button className="w-full" asChild>
          <Link to="/exam/$paperId/start" params={{ paperId }}>
            返回考试入口
          </Link>
        </Button>
      </div>
    </div>
  )
}
