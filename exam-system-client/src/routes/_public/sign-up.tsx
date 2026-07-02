import { createFileRoute, Link } from '@tanstack/react-router'
import RegisterForm from '#/features/login/RegisterForm.tsx'
import ThemeToggle from '#/components/ThemeToggle.tsx'

export const Route = createFileRoute('/_public/sign-up')({
  component: SignupPage,
})

function SignupPage() {
  return (
    <main className="flex h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            创建账号
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            注册新账号以开始使用考试系统
          </p>
        </div>

        <div className="border-border bg-card border p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <RegisterForm />
          </div>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            已有账号？{' '}
            <Link
              to="/sign-in"
              className="text-primary font-medium hover:underline"
            >
              去登录
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
