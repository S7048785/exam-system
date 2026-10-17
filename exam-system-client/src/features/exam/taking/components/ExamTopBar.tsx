import { Button } from '#/components/ui/button.tsx'
import {
  AlarmClock,
  CheckCircle2,
  GraduationCap,
  ListChecks,
  Save,
  Send,
} from 'lucide-react'
import { StatChip } from '#/features/exam/taking/components/StatChip.tsx'

/**
 * 答题页顶栏：左边试卷名 + 考生姓名，右边倒计时 / 题目数量 / 已作答数量 + **一个**动作按钮。
 *
 * 动作按钮是「保存」和「提交」两态的同一个按钮：
 * 答案有改动（`saved === false`）时显示「保存试卷」，保存过之后才变成「提交试卷」——
 * 也就是先存后交，不会出现「没保存就交卷」。
 */
export function ExamTopBar({
  paperName,
  studentName,
  countdownText,
  urgent,
  totalCount,
  answeredCount,
  saved,
  busy = false,
  onAction,
}: {
  paperName: string
  studentName: string
  /** 已格式化好的倒计时文案（未挂载时是 `--:--`） */
  countdownText: string
  /** 剩余时间不足，倒计时标红 */
  urgent: boolean
  totalCount: number
  answeredCount: number
  /** 答案是否已保存（决定动作按钮是「提交试卷」还是「保存试卷」） */
  saved: boolean
  /** 保存 / 交卷请求进行中：禁用按钮防重复提交 */
  busy?: boolean
  onAction: () => void
}) {
  return (
    <header className="bg-background/80 flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{paperName}</div>
          <div className="text-muted-foreground truncate text-xs">
            考生：{studentName}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatChip
          icon={<AlarmClock className="size-4" />}
          label="剩余时间"
          value={countdownText}
          tone={urgent ? 'danger' : 'default'}
        />
        <StatChip
          icon={<ListChecks className="size-4" />}
          label="题目数量"
          value={`${totalCount} 题`}
        />
        <StatChip
          icon={<CheckCircle2 className="size-4" />}
          label="已作答"
          value={`${answeredCount} 题`}
          tone={answeredCount === totalCount ? 'success' : 'default'}
        />

        {/* 先存后交：未保存 → 保存试卷；已保存 → 提交试卷 */}
        <Button
          className="ml-1"
          variant={saved ? 'default' : 'outline'}
          disabled={busy}
          onClick={onAction}
        >
          {saved ? <Send /> : <Save />}
          {saved ? '提交试卷' : '保存试卷'}
        </Button>
      </div>
    </header>
  )
}
