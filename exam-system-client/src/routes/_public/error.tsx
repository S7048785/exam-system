import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/error')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>页面出错了！</div>
}
