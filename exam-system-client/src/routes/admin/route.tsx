import AdminPage from '#/features/admin'
import useUserStore from '#/stores/user.ts'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  beforeLoad: () => {
    const { user } = useUserStore.getState()
    if (!user) {
      throw redirect({ to: '/sign-in' })
    }
    if (user.role !== 'admin') {
      throw redirect({ to: '/403' })
    }
  },
  ssr: false,
})
