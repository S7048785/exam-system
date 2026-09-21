import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '#/components/ui/sidebar.tsx'
import { cn } from '#/lib/utils.ts'
import { Link, useMatches, useMatchRoute } from '@tanstack/react-router'
import { ChevronDown, ChevronRight } from 'lucide-react'
import React, { Activity, useState } from 'react'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    submenu?: { title: string; url: string }[]
  }[]
}) {
  const matches = useMatches()
  const currentPaths = matches.map((m) => m.pathname)

  // 所有包含当前路径的父级菜单标题，用于初始展开（可能同时命中多个，全部展开）
  const currentParentTitles = items
    .filter((item) => item.submenu?.some((sub) => currentPaths.includes(sub.url)))
    .map((item) => item.title)

  // 用 Set 存「已展开」的菜单组，支持同时展开多个；用函数式 setState 避免闭包拿到旧值
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(currentParentTitles),
  )

  const toggleExpanded = (title: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <MenuItem
              key={item.title}
              item={item}
              isExpanded={expanded.has(item.title)}
              onToggle={() => toggleExpanded(item.title)}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function MenuItem({
  item,
  isExpanded,
  onToggle,
}: {
  item: {
    title: string
    url: string
    icon?: React.ReactNode
    submenu?: { title: string; url: string }[]
  }
  isExpanded: boolean
  onToggle: () => void
}) {
  const matchRoute = useMatchRoute()
  // 判断当前路由是否匹配某个路径
  // fuzzy: true 表示模糊匹配（包含子路径高亮）
  // 父级菜单是否激活（包含子路径）
  const isParentActive = !!matchRoute({ to: item.url, fuzzy: true })
  // 基础样式抽离，避免重复
  const activeStyles = isParentActive
    ? 'bg-primary text-primary-foreground! duration-200 ease-linear hover:bg-primary/90!'
    : ''
  // 子项高亮样式：刻意不带 hover:bg-primary/90 —— 否则未激活的子项一悬停就会变成
  // 与父级完全相同的实心主色块，视觉上分不清哪个才是当前页。
  const subActiveStyles = isParentActive
    ? 'bg-primary text-primary-foreground! duration-200 ease-linear hover:bg-primary/90!'
    : ''
  // 有子菜单的情况
  if (item.submenu) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={onToggle}
          className={cn('items-between flex min-w-8', activeStyles)}
        >
          <div className="flex gap-4">
            {item.icon}
            <span className="">{item.title}</span>
          </div>
          <div className="ml-auto">
            <Activity mode={isExpanded ? 'visible' : 'hidden'}>
              <ChevronDown className="h-4 w-4" />
            </Activity>
            <Activity mode={isExpanded ? 'hidden' : 'visible'}>
              <ChevronRight className="h-4 w-4" />
            </Activity>
          </div>
        </SidebarMenuButton>
        {isExpanded && (
          <SidebarMenuSub>
            {item.submenu.map((sub) => (
              <SidebarMenuSubItem key={sub.url}>
                <SidebarMenuSubButton asChild>
                  <Link
                    to={sub.url}
                    activeProps={{ className: subActiveStyles }}
                    className="flex gap-4"
                  >
                    {sub.title}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    )
  }

  // 普通菜单项
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          to={item.url}
          activeProps={{ className: activeStyles }}
          className={'flex gap-4'}
        >
          {item.icon}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
