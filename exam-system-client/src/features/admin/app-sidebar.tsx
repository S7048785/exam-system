import * as React from 'react'

import {NavUser} from '#/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '#/components/ui/sidebar'
import {
  Camera01Icon,
  ChartHistogramIcon,
  DashboardSquare01Icon,
  File01Icon,
  FileEditIcon,
  Folder01Icon,
  Menu01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {HugeiconsIcon} from '@hugeicons/react'
import {NavMain} from "#/features/admin/nav-main.tsx";
import {Link} from "@tanstack/react-router";

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin/dashboard',
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
    },
    {
      title: 'Banner',
      url: '/admin/banners',
      icon: <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />,
    },
    {
      title: 'Question',
      url: '/admin/questions',
      icon: <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />,
    },
    {
      title: 'Paper',
      url: '/admin/papers',
      icon: <HugeiconsIcon icon={FileEditIcon} strokeWidth={2}/>,
      submenu: [
        {title: '试卷列表', url: '/admin/papers/list'},
        {title: '创建试卷', url: '/admin/papers/create'},
      ],
    },
    {
      title: 'Categories',
      url: '/admin/categories',
      icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />,
    },
    {
      title: 'About',
      url: '/admin/about',
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
    },
  ],
  navClouds: [
    {
      title: 'Capture',
      icon: <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} />,
      isActive: true,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Proposal',
      icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} />,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
    {
      title: 'Prompts',
      icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} />,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#',
        },
        {
          title: 'Archived',
          url: '#',
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to={"/"}>
                <span className="text-base font-semibold">Exam System</span>
              </Link>
            </SidebarMenuButton>
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
