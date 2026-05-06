import {Button} from '#/components/ui/button.tsx'
import {Input} from '#/components/ui/input.tsx'
import {Label} from '#/components/ui/label.tsx'
import {useEmailAction, useRegisterAction,} from '#/features/login/useUserActions.ts'
import {useForm} from '@tanstack/react-form'
import {Ghost, Lock, User} from 'lucide-react'
import {useId, useState} from 'react'
import {toast} from 'sonner'
import z from 'zod'

const registerSchema = z.object({
  email: z.string().min(4, '邮箱长度不能小于4位字符'),
  realName: z.string().length(2, '真实姓名长度不能小于2位字符'),
  captcha: z.string().min(4, '验证码长度不能小于4位字符'),
  password: z.string().min(6, '密码长度不能小于6位字符'),
})
type RegisterFormProps = {
	onRegisterSuccess: () => void
}
export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const id = useId()
  const form = useForm({
    defaultValues: {
      email: '',
      realName: '',
      captcha: '',
      password: '',
    },
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
      await registerMutation.mutateAsync({
        captcha: value.captcha,
        email: value.email,
        realName: value.realName,
        password: value.password,
      })
      if (registerMutation.isError) {
        toast.error(registerMutation.error.message || '注册失败')
        return
      }
      onRegisterSuccess()
    },
  })
  const registerMutation = useRegisterAction()

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-5"
    >
      <div className="space-y-4">
        <form.Field
          name="email"
          children={(field) => (
            <div className="*:not-first:mt-2">
              <Label htmlFor={`${id}-email`}>邮箱</Label>
              <div className="relative">
                <Input
                  id={`${id}-email`}
                  className="ps-9"
                  placeholder="请输入邮箱"
                  required
                  autoComplete="current-email"
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <User aria-hidden="true" size={16} />
                </div>
              </div>
            </div>
          )}
        />
        <form.Field
          name="realName"
          children={(field) => (
            <div className="*:not-first:mt-2">
              <Label htmlFor={`${id}-realName`}>真实姓名</Label>
              <div className="relative">
                <Input
                  id={`${id}-realName`}
                  autoComplete="current-realName"
                  placeholder="请输入真实姓名"
                  className="ps-9"
                  required
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <Ghost aria-hidden="true" size={16} />
                </div>
              </div>
            </div>
          )}
        />
        <form.Field
          name="password"
          children={(field) => (
            <div className="*:not-first:mt-2">
              <Label htmlFor={`${id}-password`}>密码</Label>
              <div className="relative">
                <Input
                  id={`${id}-password`}
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  className="ps-9"
                  required
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <Lock aria-hidden="true" size={16} />
                </div>
              </div>
            </div>
          )}
        />

        <div className="flex items-end">
          <form.Field
            name="captcha"
            children={(field) => (
              <div className="*:not-first:mt-2 w-[70%]">
                <Label htmlFor={`${id}-captcha`}>验证码</Label>
                <div className="relative">
                  <Input
                    id={`${id}-captcha`}
                    autoComplete="current-captcha"
                    placeholder="请输入验证码"
                    className="ps-9"
                    required
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    <Lock aria-hidden="true" size={16} />
                  </div>
                </div>
              </div>
            )}
          />
          {/* 订阅 email 值 */}
          <form.Subscribe
            selector={(state) => state.values.email}
            children={(email) => <CaptchaButton email={email || ''} />}
          />
        </div>
      </div>
      <div className="flex items-center space-x-8 pt-4">
        <Button
          className="flex-1 py-6"
          type="submit"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? '注册中...' : '注册'}
        </Button>
      </div>
    </form>
  )
}

function CaptchaButton({ email }: { email: string }) {
  const [countdown, setCountdown] = useState(0)
  const emailMutation = useEmailAction()

  const handleSend = async () => {
    if (!email || countdown > 0) return

    try {
      await emailMutation.mutateAsync(email)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      // 错误已由 useEmailAction 处理
    }
  }

  return (
    <div className="flex-1">
      <Button
        variant="secondary"
        type="button"
        onClick={handleSend}
        disabled={countdown > 0 || emailMutation.isPending || !email}
        className="w-full py-4"
      >
        {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
      </Button>
    </div>
  )
}
