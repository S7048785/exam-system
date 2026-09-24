import { redirect } from '@tanstack/react-router'
import type { UserInfo } from '#/stores/user.ts'

export function redirectIfAuthenticated(user: UserInfo | null): void {
  if (!user) return
  if (user.role === 'admin') throw redirect({ to: '/dashboard' })
  throw redirect({ to: '/' })
}
