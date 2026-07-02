import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  head: () => ({
    meta: [
      {
        title: '出错了! - 考试系统',
      },
    ],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <h2>404 - 页面没找到</h2>
      <p>抱歉，您访问的路径不存在。</p>
      <Link to="/">返回首页</Link>
    </div>
  )
}
