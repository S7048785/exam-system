import { Button } from '#/components/ui/button.tsx'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useLoginAction } from '#/features/login/useUserActions.ts'
import { useForm } from '@tanstack/react-form'
import { Lock, User } from 'lucide-react'
import { useId, useState } from 'react'
import z from 'zod'
import { toast } from 'sonner'

const userSchema = z.object({
  email: z.string().min(4, '用户名长度不能小于4位字符'),
  password: z.string().min(6, '密码长度不能小于6位字符'),
})

const REMEMBERED_CREDENTIALS_KEY = 'remembered-credentials'

/**
 * 从本地存储中获取保存的登录凭证据
 */
function getSavedCredentials(): { email: string; password: string } | null {
  try {
    const raw = localStorage.getItem(REMEMBERED_CREDENTIALS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface LoginFormProps {
  onLoginSuccess: () => Promise<void>
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const saved = getSavedCredentials()

  const id = useId()

  const loginMutation = useLoginAction()
  const [rememberMe, setRememberMe] = useState(!!saved)

  const form = useForm({
    defaultValues: {
      email: saved?.email || '',
      password: saved?.password || '',
    },
    validators: {
      onChange: userSchema,
    },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(
        {
          email: value.email,
          password: value.password,
        },
        {
          onError: (error: any) => {
            toast.error(error.message || '网络错误')
            form.resetField('password')
            return
          },
          onSuccess: async () => {
            toast.success('登录成功')

            if (rememberMe) {
              localStorage.setItem(
                REMEMBERED_CREDENTIALS_KEY,
                JSON.stringify({
                  email: value.email,
                  password: value.password,
                }),
              )
            } else {
              localStorage.removeItem(REMEMBERED_CREDENTIALS_KEY)
            }
            onLoginSuccess()
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
                  autoComplete="on"
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
          name="password"
          children={(field) => (
            <div className="*:not-first:mt-2">
              <Label htmlFor={`${id}-password`}>密码</Label>
              <div className="relative">
                <Input
                  id={`${id}-password`}
                  autoComplete="on"
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
      </div>
      <div className="flex justify-end gap-2">
        <Checkbox
          id={`${id}-remember`}
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(!!checked)}
        />
        <Label htmlFor={`${id}-remember`} className="cursor-pointer text-sm">
          记住密码
        </Label>
      </div>
      <div className="flex w-full flex-col items-center gap-y-4">
        <Button
          className="w-full py-6"
          type="submit"
          size="lg"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? '登录中...' : '登录'}
        </Button>
      </div>
    </form>
  )
}
