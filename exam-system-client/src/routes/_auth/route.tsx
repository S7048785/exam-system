import { createFileRoute, Outlet } from '@tanstack/react-router'
import ThemeToggle from '#/components/ThemeToggle.tsx'

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="flex h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </main>
  )
}
