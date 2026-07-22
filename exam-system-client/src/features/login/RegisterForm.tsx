import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useRegisterAction } from '#/features/login/useUserActions.ts'
import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { Ghost, Lock, User } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'
import CapWidget from '#/components/CapWidget.tsx'

export const registerSchema = z.object({
  email: z.email().min(4, '邮箱长度不能小于4位字符'),
  realName: z.string().min(2, '真实姓名长度不能小于2位字符'),
  password: z.string().min(6, '密码长度不能小于6位字符'),
})

export default function RegisterForm() {
  const id = useId()
  const router = useRouter()
  const registerMutation = useRegisterAction()

  const [captchaToken, setCaptchaToken] = useState('')
  const capRef = useRef<any>(null)

  const form = useForm({
    defaultValues: {
      email: '',
      realName: '',
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
          email: value.email,
          realName: value.realName,
          password: value.password,
          captchaToken,
        },
        {
          onSuccess: () => {
            toast.success('注册成功，请查收验证邮件')
            router.navigate({ to: '/sign-in' })
          },
          onError: (error: any) => {
            toast.error(error.message || '注册失败')
            setCaptchaToken('')
            capRef.current?.reset?.()
          },
        },
      )
    },
  })

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
