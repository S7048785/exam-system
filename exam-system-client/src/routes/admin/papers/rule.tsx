import RuleCreatePage from '#/features/admin/papers/components/RuleCreatePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/papers/rule')({
  component: RuleCreatePage,
})
