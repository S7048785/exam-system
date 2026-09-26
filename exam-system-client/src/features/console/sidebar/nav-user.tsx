import { Activity, useEffect, useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar.tsx'
import type { ThemeMode } from '#/components/ThemeToggle.tsx'
import { applyThemeMode, getInitialMode } from '#/components/ThemeToggle.tsx'
import { LogOut, Monitor, Moon, MoveVertical, Sun } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'

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
  const router = useRouter()
  const queryClient = useQueryClient()
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

  async function handleLogout() {
    try {
      // 1. 调用后端 logout API → 清除 Sa-Token session + cookie access_token
      //    必须 await：下面 invalidate 要带着「已失效的 cookie」去重新拉用户，
      //    不等它返回就 invalidate，fetchUser 可能仍拿到用户 → 登录页把人弹回去
      await api.userController.logout()
    } finally {
      // 2. 清除 TanStack Query 所有缓存 → 旧数据不再展示
      queryClient.clear()

      // 3. 重新执行所有路由的 beforeLoad → fetchUser() 返回 null
      //    → 路由上下文 user 变 null，侧边栏 / Header 立刻变回未登录
      //    （用户信息现在只有路由上下文这一份，不再需要手动清 zustand）
      await router.invalidate()

      // 4. 跳转到登录页
      navigate({ to: '/login' })
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground shadow"
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
              onSelect={(e) => {
                e.preventDefault()
                toggleTheme()
              }}
            >
              <Activity mode={theme === 'light' ? 'visible' : 'hidden'}>
                <Sun strokeWidth={2} />
              </Activity>
              <Activity mode={theme === 'dark' ? 'visible' : 'hidden'}>
                <Moon strokeWidth={2} />
              </Activity>
              <Activity mode={theme === 'auto' ? 'visible' : 'hidden'}>
                <Monitor strokeWidth={2} />
              </Activity>
              切换主题
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut strokeWidth={2} />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
