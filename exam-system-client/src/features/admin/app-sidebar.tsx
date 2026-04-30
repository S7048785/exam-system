import * as React from 'react'

import {NavUser} from '#/components/nav-user'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from '#/components/ui/sidebar'
import {NavMain} from '#/features/admin/nav-main.tsx'

import {Link} from '@tanstack/react-router'
import {ChartBar, EqualApproximately, Folder, Menu, ScrollText,} from 'lucide-react'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Banner',
      url: '/admin/banners',
      icon: <Menu strokeWidth={2} />,
    },
    {
      title: 'Question',
      url: '/admin/questions',
      icon: <ChartBar strokeWidth={2} />,
    },
    {
      title: 'Paper',
      url: '/admin/papers',
      icon: <ScrollText strokeWidth={2} />,
      submenu: [
        { title: '试卷列表', url: '/admin/papers/list' },
        { title: '创建试卷', url: '/admin/papers/create' },
        { title: '规则创建', url: '/admin/papers/rule' },
      ],
    },
    {
      title: 'Categories',
      url: '/admin/categories',
      icon: <Folder strokeWidth={2} />,
    },
    {
      title: 'About',
      url: '/admin/about',
      icon: <EqualApproximately strokeWidth={2} />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
