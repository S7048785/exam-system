import AdminPage from '#/features/admin'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  ssr: false,
  beforeLoad: ({ context }) => {
    // 登录校验
    if (!context.user) {
      throw redirect({ to: '/sign-in' })
    }
    // 权限校验
    if (context.user.role !== 'admin') {
      throw redirect({ to: '/403' })
    }
  },
})
