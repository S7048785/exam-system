import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_admin')({
	component: RouteCommponent,
	errorComponent: ErrorComponent,
	/**
	 * 管理员区域的角色守卫：接口那边 403 是要拿 admin 角色，非管理员手敲 /dashboard 能进来，
	 * 在一次必然失败的请求之后才被弹走。在 beforeLoad 里直接拦掉（服务端同样生效）。
	 *
	 * ⚠️ 如果不想拦、想让 403 走 `ApiInstance.ts` 的 `throw redirect` —— 说一声就删掉这段。
	 */
	beforeLoad: ({ context }) => {
		if (context.user?.role !== 'admin') {
			throw redirect({ to: '/403' })
		}
	},
})

function RouteCommponent() {
	return <Outlet />
}
function ErrorComponent() {
	return <div>
		访问错误
	</div>
}
