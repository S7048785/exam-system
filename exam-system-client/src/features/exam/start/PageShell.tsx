import { Link, useRouteContext } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button.tsx'
import { Avatar, AvatarFallback } from '#/components/ui/avatar.tsx'

/**
 * 页面骨架：顶部导航栏（左 logo + 站名，右 用户名 + 头像）+ 居中内容区。
 *
 * 登录态取自**根路由上下文**（`__root.tsx` 的 `beforeLoad` 里用 `createServerFn` 带着 cookie
 * 拉到的用户信息），不再读 zustand —— 那份是 localStorage 里的客户端副本，SSR 阶段拿不到，
 * 会出现「服务端按未登录渲染、客户端接管后突然变成已登录」的跳变。
 */
export function PageShell({ children }: { children: ReactNode }) {
  const { user } = useRouteContext({ from: '__root__' })
  const isLoggedIn = !!user

  return (
    <div className="from-primary/10 via-background to-background flex min-h-screen flex-col bg-linear-to-br">
      {/* 导航栏 */}
      <header className="bg-background/80 flex items-center justify-between border-b px-6 py-3 backdrop-blur">
        {/* 左侧：logo + 网站名 */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/favicon.ico" alt="logo" className="size-8 rounded-md" />
          <span className="text-base font-semibold">在线考试系统</span>
        </Link>

        {/* 右侧：用户名 + 头像（NavUser 同款 Avatar） */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium">{user.realName}</span>
            <Avatar className="size-8 rounded-lg">
              {/* 后端 USER_INFO 只返回 id / email / realName / role，没有 avatar，
                  所以这里不挂 AvatarImage，直接显示姓名首字 */}
              <AvatarFallback className="rounded-lg">
                {user.realName.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link to="/login">登录</Link>
          </Button>
        )}
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
