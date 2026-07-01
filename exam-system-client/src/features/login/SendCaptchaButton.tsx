import { useEffect, useRef, useState } from 'react'
import { useEmailAction } from '#/features/login/useUserActions.ts'
import { Button } from '#/components/ui/button.tsx'
import { registerSchema } from '#/features/login/RegisterForm.tsx'

export default function SendCaptchaButton({
  email,
  disabled,
}: {
  email: string
  disabled: boolean
}) {
  // 计时倒计时60秒
  const [countdown, setCountdown] = useState(0)
  // 发送验证码
  const emailMutation = useEmailAction()
  // 定时器引用
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // 该组件频繁重渲染，无需useMemo
  const isDisabled =
    disabled ||
    !registerSchema.shape.email.safeParse(email).success ||
    countdown > 0 ||
    emailMutation.isPending

  // 组件卸载时清除定时器
  useEffect(() => () => clearInterval(timerRef.current || undefined), [])

  // 发送验证码
  const handleSend = async () => {
    if (isDisabled) return

    try {
      await emailMutation.mutateAsync(email)
      setCountdown(60)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      // 错误已经由 useEmailAction 处理
    }
  }

  return (
    <div className="flex-1">
      <Button
        variant="secondary"
        type="button"
        onClick={handleSend}
        disabled={isDisabled}
        className="w-full py-4 text-sm"
      >
        {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
      </Button>
    </div>
  )
}
