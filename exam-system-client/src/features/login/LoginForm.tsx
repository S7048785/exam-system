import {api} from '#/ApiInstance.ts'
import CapWidget from '#/components/CapWidget'
import {Button} from '#/components/ui/button.tsx'
import {Input} from '#/components/ui/input.tsx'
import {Label} from '#/components/ui/label.tsx'
import {useLoginAction} from '#/features/login/useUserActions.ts'
import {encryptWithPublicKey} from '#/lib/crypto'
import {useForm} from '@tanstack/react-form'
import {useRouter} from '@tanstack/react-router'
import {Lock, User} from 'lucide-react'
import {memo, useEffect, useId, useRef, useState} from 'react'
import {toast} from 'sonner'
import z from 'zod'
import {useQueryClient} from "@tanstack/react-query";
import {getUserInfoQueryOptions} from "#/features/login/userQueries.ts";

const userSchema = z.object({
  email: z.string().min(4, '用户名长度不能小于4位字符'),
  password: z.string().min(6, '密码长度不能小于6位字符'),
})

type LoginFormProps = {
  onLoginSuccess: () => void
}

function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const id = useId()
  const [publicKey, setPublicKey] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const capRef = useRef<any>(null)

  const router = useRouter()
  const queryClient = useQueryClient();
  const loginMutation = useLoginAction()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: userSchema,
    },
    onSubmit: async ({ value }) => {
      if (!captchaToken) {
        toast.warning('请先完成验证码')
        return
      }

      const encryptedPassword = await encryptWithPublicKey(value.password, publicKey)
      if (!encryptedPassword) {
        toast('密码加密失败')
        return
      }

      await loginMutation.mutateAsync({
        email: value.email,
        encryptedPassword,
        token: captchaToken,
      })

      if (loginMutation.isError) {
        form.resetField('password')
        setCaptchaToken('')
        capRef.current?.reset?.()
        return
      }

			await queryClient.fetchQuery(getUserInfoQueryOptions)
      await router.invalidate()
      onLoginSuccess()
    },
  })

  useEffect(() => {
    let mounted = true

    api.userController.getPublicKey().then((res) => {
      if (mounted && res.code === 200) {
        setPublicKey(res.data ?? '')
      }
    })

    return () => {
      mounted = false
    }
  }, [])

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
      </div>
      <div className="flex items-center space-x-8 pt-4">
        <CapWidget ref={capRef} onSetCaptchaToken={setCaptchaToken} />
        <Button className="flex-1 py-6" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? '登录中...' : '登录'}
        </Button>
      </div>
    </form>
  )
}

export default memo(LoginForm)
