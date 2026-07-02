import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import useUserStore from '#/stores/user.ts'

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
  beforeLoad: () => {
    const { isLoggedIn } = useUserStore.getState()
    if (!isLoggedIn) {
      throw redirect({ to: '/sign-in' })
    }
  },
})

function RouteComponent() {
  return <Outlet />
}
