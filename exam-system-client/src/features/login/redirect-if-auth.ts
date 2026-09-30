import { redirect } from '@tanstack/react-router'
import type { UserInfo } from '#/lib/user.ts'

export function redirectIfAuthenticated(user: UserInfo | null): void {
  if (!user) return
  // /dashboard 已从路由树移除，admin 改落试卷列表
  if (user.role === 'admin') throw redirect({ to: '/papers/list' })
  throw redirect({ to: '/' })
}
