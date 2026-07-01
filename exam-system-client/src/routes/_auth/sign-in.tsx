import { createFileRoute, Link } from '@tanstack/react-router'
import LoginForm from '#/features/login/LoginForm.tsx'

export const Route = createFileRoute('/_auth/sign-in')({
  component: SigninPage,
})

function SigninPage() {
  return (
    <>
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
          <LoginForm />
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
    </>
  )
}
