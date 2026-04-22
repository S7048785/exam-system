import DashboardPage from 'src/features/admin/dashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/dashboard')({
  component: DashboardPage,
})
