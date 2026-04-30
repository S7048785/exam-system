import AdminPage from '#/features/admin'
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})
