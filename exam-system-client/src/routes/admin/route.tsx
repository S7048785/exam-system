import AdminSidebar from '#/features/admin/Sidebar'
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: AdminSidebar,
})