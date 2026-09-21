import RuleCreatePage from '#/features/console/papers/components/RuleCreatePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/papers/rule')({
  component: RuleCreatePage,
})
