import { createFileRoute, redirect } from '@tanstack/react-router'
import ControllerPage from "#/features/console";

export const Route = createFileRoute('/_auth')({
  component: ControllerPage,
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' })
    }
  },
  ssr: false,
  pendingComponent: () => {
    return <div className="flex min-h-screen items-center justify-center text-sm">
      加载中…
    </div>
  },
})
