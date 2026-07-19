import * as React from 'react'

import { NavUser } from '#/features/admin/sidebar/nav-user.tsx'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '#/components/ui/sidebar.tsx'
import { NavMain } from '#/features/admin/sidebar/nav-main.tsx'
import useUserStore from '#/stores/user.ts'

import { Link } from '@tanstack/react-router'
import {
  ChartBar,
  EqualApproximately,
  Folder,
  LayoutDashboard,
  ScrollText,
  Users,
} from 'lucide-react'

const navMain = [
  {
    title: '仪表盘',
    url: '/admin/dashboard',
    icon: <LayoutDashboard strokeWidth={2} />,
  },
  // {
  //   title: '轮播图',
  //   url: '/admin/banners',
  //   icon: <Menu strokeWidth={2} />,
  // },
  {
    title: '题目',
    url: '/admin/questions',
    icon: <ChartBar strokeWidth={2} />,
  },
  {
    title: '用户管理',
    url: '/admin/users',
    icon: <Users strokeWidth={2} />,
  },
  {
    title: '试卷',
    url: '/admin/papers',
    icon: <ScrollText strokeWidth={2} />,
    submenu: [
      { title: '试卷列表', url: '/admin/papers/list' },
      { title: '规则创建', url: '/admin/papers/rule' },
      { title: '试卷分类', url: '/admin/paper-categories' },
    ],
  },
  {
    title: '分类',
    url: '/admin/categories',
    icon: <Folder strokeWidth={2} />,
  },
  {
    title: 'About',
    url: '/admin/about',
    icon: <EqualApproximately strokeWidth={2} />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useUserStore((s) => s.user)

  const navUser = user
    ? { name: user.realName, email: user.email ?? '', avatar: '' }
    : { name: '未登录', email: '', avatar: '' }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to={'/'} className="p-5">
              <span className="text-base font-semibold">Exam System</span>
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
