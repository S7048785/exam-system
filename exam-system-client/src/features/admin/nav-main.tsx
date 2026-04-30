import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '#/components/ui/sidebar'
import {cn} from '#/lib/utils.ts'
import {Link, useMatches, useMatchRoute} from '@tanstack/react-router'
import {ChevronDown, ChevronRight} from 'lucide-react'
import React, {useState} from 'react'

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

  // 找到当前路径对应的父级菜单标题，用于初始展开
  const currentParentTitle = items.find((item) =>
    item.submenu?.some((sub) => currentPaths.includes(sub.url)),
  )?.title

  const [expanded, setExpanded] = useState<string | null>(
    currentParentTitle ?? null,
  )

  const toggleExpanded = (title: string) => {
    setExpanded((prev) => (prev === title ? null : title))
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <MenuItem
              key={item.title}
              item={item}
              isExpanded={expanded === item.title}
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
  const activeStyles =
    'min-w-8 bg-primary duration-200 ease-linear hover:bg-primary/90!'
  // 有子菜单的情况
  if (item.submenu) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={onToggle}
          className={cn('min-w-8', isParentActive && activeStyles)}
        >
          {item.icon}
          <span className="flex-1">{item.title}</span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </SidebarMenuButton>
        {isExpanded && (
          <SidebarMenuSub>
            {item.submenu.map((sub) => (
              <SidebarMenuSubItem key={sub.url}>
                <SidebarMenuSubButton asChild>
                  <Link
                    to={sub.url}
                    activeProps={{ className: activeStyles }}
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
