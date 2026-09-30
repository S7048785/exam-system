import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import LoginForm from '#/features/login/LoginForm.tsx'
import ThemeToggle from '#/components/ThemeToggle.tsx'
import { redirectIfAuthenticated } from '#/features/login/redirect-if-auth.ts'
import type { UsersDto } from '#/__generated/model/dto'

export const Route = createFileRoute('/_public/login')({
  component: SigninPage,
  beforeLoad: ({ context }) => {
    redirectIfAuthenticated(context.user)
  },
  ssr: false
})

function SigninPage() {
  const router = useRouter()
  const navigate = useNavigate()

  const onLoginSuccess = async (user: UsersDto['UserController/USER_INFO']) => {
    // 登录成功只是把 cookie 写好了，路由上下文里的 user 还是旧的（未登录）。
    // 必须 invalidate 让根 beforeLoad 重新 fetchUser()，否则紧接着跳控制台时
    // `_auth` 的守卫看到的 context.user 仍是 null，会把刚登录的人弹回登录页（死循环）。
    await router.invalidate()
    // /dashboard 已从路由树移除，admin 改落试卷列表
    if (user.role === 'admin') {
      await navigate({ to: '/papers/list' })
    } else {
      await navigate({ to: '/' })
    }
  }
  return (
    <main className="flex h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            欢迎回来
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            登录你的账号以继续使用考试系统
          </p>
        </div>
        <div className="border-border bg-card border p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <LoginForm onLoginSuccess={onLoginSuccess} />
          </div>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            没有账号？{' '}
            <Link
              to="/register"
              className="text-primary font-medium hover:underline"
            >
              去注册
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
