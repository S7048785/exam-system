import useUserStore from '#/stores/user.ts'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/exam')({
  beforeLoad: () => {
    const { user } = useUserStore.getState()
    if (!user) {
      throw redirect({ to: '/sign-in' })
    }
  },
})
