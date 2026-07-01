import { api } from '#/ApiInstance.ts'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { useLoginAction } from '#/features/login/useUserActions.ts'
import useUserStore from '#/stores/user.ts'
import { useForm } from '@tanstack/react-form'
import { Lock, User } from 'lucide-react'
import { useId } from 'react'
import z from 'zod'
import { toast } from 'sonner'

const userSchema = z.object({
  email: z.string().min(4, '用户名长度不能小于4位字符'),
  password: z.string().min(6, '密码长度不能小于6位字符'),
})

export default function LoginForm() {
  const id = useId()

  const loginMutation = useLoginAction()
  const setUser = useUserStore((s) => s.setUser)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
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
            const res = await api.userController.getUserInfo()
            setUser(res.data)
          },
        },
      )

      // 使所有路由的 loader 数据失效，强制它们在下次渲染时重新执行。
      // await router.invalidate()
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
      </div>
      <div className="mt-8 flex w-full flex-col items-center gap-y-4">
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
