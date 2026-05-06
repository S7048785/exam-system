import AdminPage from '#/features/admin'
import {createFileRoute, redirect} from '@tanstack/react-router'
import useUserStore from "#/stores/user.ts";

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  beforeLoad: () => {
    if (useUserStore.getState().user?.role !== 'admin') {
      throw redirect({to: '/403'})
    } else {
      throw redirect({
        to: '/admin/banners',
      })
    }
  }
})
