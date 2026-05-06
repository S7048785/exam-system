import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/_public/403')({
	component: RouteComponent,
})

function RouteComponent() {
	return <div className="flex flex-col items-center justify-center h-screen">
		<h1 className="text-4xl font-bold">403 - 权限不足</h1>
		<p>抱歉，你没有访问此页面的权限。</p>
		<button onClick={() => window.history.back()}>返回上一页</button>
	</div>
}
