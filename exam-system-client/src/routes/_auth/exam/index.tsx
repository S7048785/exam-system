import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/exam/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/exam/"!</div>
}
