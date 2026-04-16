import Footer from '#/components/Footer'
import Header from '#/components/Header'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
