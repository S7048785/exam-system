import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '#/components/ui/sidebar'
import {Link, useLocation} from '@tanstack/react-router'
import {useMemo} from "react";

export function NavMain({
													items,
												}: {
	items: {
		title: string
		url: string
		icon?: React.ReactNode
	}[]
}) {
	const location = useLocation()
  // 在 NavMain 外部或用 memo

  const isActive = useMemo(() => (url: string) => url === location.pathname, [location.pathname]);

	return (
			<SidebarGroup>
				<SidebarGroupContent className="flex flex-col gap-2">
					<SidebarMenu>
						{items.map((item) => (
                <MemoizedMenuItem key={item.url} item={item} isActive={isActive(item.url)} />
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
	)
}

function MemoizedMenuItem({ item, isActive }: { item: {
    title: string
    url: string
    icon?: React.ReactNode
  }, isActive: boolean }) {
return (
    <SidebarMenuItem>
			<Link to={item.url} >
      <SidebarMenuButton
					className={isActive ? 'min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground' : 'text-primary-foreground'}
      >
          {item.icon}
          <span>{item.title}</span>
      </SidebarMenuButton>
			</Link>
    </SidebarMenuItem>
)}