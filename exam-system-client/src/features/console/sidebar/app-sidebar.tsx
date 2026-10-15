import * as React from 'react'

import { NavUser } from '#/features/console/sidebar/nav-user.tsx'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '#/components/ui/sidebar.tsx'
import { NavMain } from '#/features/console/sidebar/nav-main.tsx'

import { Link, useRouteContext } from '@tanstack/react-router'
import { ChartBar, EqualApproximately, ScrollText } from 'lucide-react'

// ⚠️ /dashboard 与 /users 已从路由树移除（路由文件加了 `-` 前缀，见 _auth/_admin/）：
// 不要再往这里加这两项，点了会 404。
const navMain = [
  {
    title: '试卷',
    url: '/papers',
    icon: <ScrollText strokeWidth={2} />,
    submenu: [
      { title: '试卷列表', url: '/papers/list' },
      { title: '人工判卷', url: '/papers/report' },
      { title: '规则创建', url: '/papers/rule' },
      { title: '试卷分类', url: '/papers/categories' },
    ],
  },
  {
    title: '试题',
    url: '/questions',
    icon: <ChartBar strokeWidth={2} />,
    submenu: [
      { title: '题目列表', url: '/questions/list' },
      { title: '试题分类', url: '/questions/categories' },
    ],
  },
  {
    title: 'About',
    url: '/about',
    icon: <EqualApproximately strokeWidth={2} />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // 登录态取自路由上下文（根 beforeLoad 里 createServerFn 拉的用户信息），不再读 zustand
  const { user } = useRouteContext({ from: '__root__' })

  const navUser = user
    ? { name: user.realName, email: user.email ?? '', avatar: '' }
    : { name: '未登录', email: '', avatar: '' }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to={'/'} className="flex items-center gap-2.5 px-5 py-4">
              <img
                src="/favicon.ico"
                alt="logo"
                className="size-7 rounded-md"
              />
              <span className="text-base font-semibold">在线考试系统</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
