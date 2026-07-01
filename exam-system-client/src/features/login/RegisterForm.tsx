import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  useEmailAction,
  useRegisterAction,
} from '#/features/login/useUserActions.ts'
import { useForm, useStore } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { Ghost, Key, Lock, User } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'
import TimingButton from '#/features/login/TimingButton.tsx'
import CapWidget from '#/components/CapWidget.tsx'

export const registerSchema = z.object({
  email: z.email().min(4, '邮箱长度不能小于4位字符'),
  realName: z.string().length(2, '真实姓名长度必须是2位字符'),
  captcha: z.string().min(4, '验证码长度不能小于4位字符'),
  password: z.string().min(6, '密码长度不能小于6位字符'),
})

export default function RegisterForm() {
  const id = useId()
  const router = useRouter()
  const registerMutation = useRegisterAction()

  const [captchaToken, setCaptchaToken] = useState('')
  const capRef = useRef<any>(null)

  const emailMutation = useEmailAction()
  const handleEmailSend = async () => {
    console.log('重复渲染')
    const email = form.getFieldValue('email')
    await emailMutation.mutateAsync({ email, captcha: captchaToken })
    toast.success('验证码发送成功')
  }

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
      if (!captchaToken) {
        toast.warning('请先完成验证码')
        return
      }

      registerMutation.mutate(
        {
          captcha: value.captcha,
          email: value.email,
          realName: value.realName,
          password: value.password,
        },
        {
          onSuccess: () => {
            toast.success('注册成功')
          },
          onError: (error: any) => {
            toast.error(error.message || '注册失败')
            setCaptchaToken('')
            capRef.current?.reset?.()
          },
        },
      )

      await router.navigate({ to: '/sign-in' })
    },
  })
  // 1. 用 useStore 订阅 email，这个值变化会触发组件重新渲染
  const email = useStore(form.store, (state) => state.values.email)

  const emailSendButtonDisabled = useMemo(() => {
    return (
      captchaToken.length === 0 ||
      !registerSchema.shape.email.safeParse(email).success
    )
  }, [captchaToken, email])

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
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
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
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
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
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <Lock aria-hidden="true" size={16} />
                </div>
              </div>
            </div>
          )}
        />
        <CapWidget ref={capRef} onSetCaptchaToken={setCaptchaToken} />
        <div className="mt-4 flex items-end">
          <form.Field
            name="captcha"
            children={(field) => (
              <div className="w-[70%] *:not-first:mt-2">
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
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <Key aria-hidden="true" size={16} />
                  </div>
                </div>
              </div>
            )}
          />
          <TimingButton
            onClick={handleEmailSend}
            disabled={emailSendButtonDisabled}
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
