import { Activity, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar'
import useUserStore from '#/stores/user.ts'
import type { ThemeMode } from '#/components/ThemeToggle.tsx'
import { applyThemeMode, getInitialMode } from '#/components/ThemeToggle.tsx'
import { LogOut, Monitor, Moon, MoveVertical, Sun } from 'lucide-react'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<ThemeMode>(getInitialMode)

  // Apply theme on change
  useEffect(() => {
    applyThemeMode(theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  // Listen for system preference changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [theme])

  function toggleTheme() {
    const next: ThemeMode =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'
    setTheme(next)
  }

  function handleLogout() {
    useUserStore.getState().logout()
    navigate({ to: '/sign-in' })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <MoveVertical strokeWidth={2} className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'top'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-center text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center"
              onSelect={(e) => {
                e.preventDefault()
                toggleTheme()
              }}
            >
              <Activity mode={theme === 'light' ? 'visible' : 'hidden'}><Sun strokeWidth={2} /></Activity>
              <Activity mode={theme === 'dark' ? 'visible' : 'hidden'}><Moon strokeWidth={2} /></Activity>
              <Activity mode={theme === 'auto' ? 'visible' : 'hidden'}><Monitor strokeWidth={2} /></Activity>
              切换主题
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center" onClick={handleLogout}>
              <LogOut strokeWidth={2} />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
