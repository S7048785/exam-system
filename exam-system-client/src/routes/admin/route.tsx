import AdminPage from '#/features/admin'
import useUserStore from '#/stores/user.ts'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  beforeLoad: () => {
    const { user } = useUserStore.getState()
    // 登录校验
    if (!user) {
      throw redirect({ to: '/sign-in' })
    }
    // 权限校验
    if (user.role !== 'admin') {
      throw redirect({ to: '/403' })
    }
  },
  ssr: false,
})
