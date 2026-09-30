import { Separator } from '#/components/ui/separator.tsx'
import { SidebarTrigger } from '#/components/ui/sidebar.tsx'
import { useMatches } from '@tanstack/react-router'

// ⚠️ 顺序敏感：下面用 pathname.startsWith 做**前缀匹配**并取首个命中，
// 所以子路径条目必须排在它的父前缀之前（如 /questions/categories 在 /questions 之前），
// 否则子页标题会被父前缀吃掉，永远显示父级标题。
const routeTitles: Record<string, string> = {
  '/questions/categories': '分类管理',
  '/questions/list': '题目管理',
  '/papers/list': '试卷列表',
  '/papers/rule': '规则创建',
  '/papers/categories': '试卷分类',
  '/about': '关于',
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
