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
        {/* Ambient Background Blurs (Global) */}
        <div className="pointer-events-none fixed top-0 left-0 z-0 h-screen w-full overflow-hidden">
          {/* Top Left Blob: Gold/Stone hue in dark mode, subtle stone in light */}
          <div className="absolute top-[-10%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-stone-200/40 mix-blend-multiply blur-[100px] transition-colors duration-1000 dark:bg-amber-900/10 dark:mix-blend-screen"></div>

          {/* Bottom Right Blob: Jade/Moss hue */}
          <div className="absolute right-[-10%] bottom-[-10%] h-[50vw] w-[50vw] rounded-full bg-blue-100/40 mix-blend-multiply blur-[120px] transition-colors duration-1000 dark:bg-blue-900/15 dark:mix-blend-screen"></div>
        </div>
        <Outlet />
      </div>
    </main>
  )
}
