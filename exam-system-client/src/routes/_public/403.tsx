import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/403')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 space-y-6 text-center">
      <img
        src="https://gitee.com/static/errors/images/403.png"
        alt=""
        className="mx-auto"
      />
      <div className="text-neutral-10 text-lg">你的访问受限!</div>
      <div className="text-neutral-9">
        服务器拒绝处理您的请求！您可能没有访问此操作的权限，
        <Link to="/" className="text-blue-400 hover:text-blue-500 hover:[text-shadow:0_0_10px_rgba(59,130,246,0.6)] transition-all duration-300 ease-in-out font-medium no-underline">点击这里</Link>
        返回首页
      </div>
    </div>
  )
}
