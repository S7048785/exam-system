import { Button } from '#/components/ui/button.tsx'
import { cn } from '#/lib/utils.ts'
import { EntryNotice } from './EntryNotice.tsx'
import type { EntryPhase } from './utils.ts'

/** 账号登录考试的按钮文案 —— 时间窗 + 「我」的记录两个维度 */
const LABEL: Record<EntryPhase, string> = {
  NOT_STARTED: '考试未开始',
  NEED_LOGIN: '需要登录',
  READY: '开始考试',
  ONGOING: '继续考试',
  FINISHED: '考试已结束',
}

/** 考试中 → 警告色，盖掉 Button 默认的 primary 底色 */
const ONGOING_CLASS =
  'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500'

interface AccountEntryProps {
  phase: EntryPhase
  submitting: boolean
  /** 姓名一律取账号里的 —— 后端也只认账号里的，请求体里传的会被忽略 */
  realName?: string
  onStart: (studentName: string) => void
}

/**
 * 账号登录考试的入场区：不弹姓名输入框，考生身份就是当前登录账号。
 *
 * 「考到一半」的判断只有这条路径做得了 —— 免登录模式拿不到历史记录。
 */
export function AccountEntry({
  phase,
  submitting,
  realName,
  onStart,
}: AccountEntryProps) {
  const canStart = phase === 'READY' || phase === 'ONGOING'

  return (
    <>
      {phase === 'NEED_LOGIN' && (
        <EntryNotice>该考试要求登录后才能参加，请先登录。</EntryNotice>
      )}

      <Button
        className={cn(
          'h-11 w-full text-base',
          phase === 'ONGOING' && ONGOING_CLASS,
        )}
        onClick={() => onStart(realName ?? '')}
        disabled={!canStart || submitting}
      >
        {submitting ? '正在开考…' : LABEL[phase]}
      </Button>
    </>
  )
}
