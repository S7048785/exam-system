import AdminPage from '#/features/admin'
import {createFileRoute, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  beforeLoad: ({context}) => {
    const {user} = context
    if (!user) {
      throw redirect({to: '/'})
    }
    if (user.role !== 'admin') {
      throw redirect({to: '/403'})
    }
  }
})
