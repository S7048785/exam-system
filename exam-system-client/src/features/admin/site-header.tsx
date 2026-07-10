import { Separator } from '#/components/ui/separator.tsx'
import { SidebarTrigger } from '#/components/ui/sidebar.tsx'
import { useMatches } from '@tanstack/react-router'

const routeTitles: Record<string, string> = {
  '/admin/dashboard': '仪表盘',
  '/admin/questions': '题目管理',
  '/admin/papers/list': '试卷列表',
  '/admin/papers/create': '创建试卷',
  '/admin/papers/rule': '规则创建',
  '/admin/banners': '轮播图',
  '/admin/categories': '分类管理',
  '/admin/about': '关于',
}

export function SiteHeader() {
  const matches = useMatches()
  const lastMatch = matches[matches.length - 1]
  const pathname = lastMatch.pathname
  // 优先精确匹配，再尝试前缀匹配（处理 /admin/papers/5/edit 这类动态路由）
  const title =
    Object.entries(routeTitles).find(([key]) =>
      pathname.startsWith(key),
    )?.[1] ?? 'Documents'

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
