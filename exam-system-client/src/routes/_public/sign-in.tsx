import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import LoginForm from '#/features/login/LoginForm.tsx'
import ThemeToggle from '#/components/ThemeToggle.tsx'
import { redirectIfAuthenticated } from '#/features/login/redirect-if-auth.ts'
import useUserStore from "#/stores/user.ts";
import {api} from "#/ApiInstance.ts";

export const Route = createFileRoute('/_public/sign-in')({
  component: SigninPage,
  ssr: false,
  beforeLoad: ({ context }) => {
    redirectIfAuthenticated(context.user)
  },
})

function SigninPage() {
  const setUser = useUserStore((s) => s.setUser)

  const navigate = useNavigate()

  const onLoginSuccess = async () => {

    const res = await api.userController.getUserInfo()
    setUser(res.data)
    if (res.data.role === 'admin') {
      navigate({ to: '/admin/questions' })
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
            <LoginForm onLoginSuccess={onLoginSuccess}/>
          </div>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            没有账号？{' '}
            <Link
              to="/sign-up"
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
