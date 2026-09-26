import { ApiError } from '#/lib/api-error.ts'

/**
 * 为什么 401/403 的跳转要放在这里，而不是像以前那样在 fetch 执行器里 `throw redirect`：
 *
 * `throw redirect()` 只有在**路由上下文**（`beforeLoad` / `loader`）里抛出时才会被
 * TanStack Router 捕获并跳转。一旦它从 `useMutation` 的 mutationFn 里抛出来，
 * 就会变成一个普通的 Promise reject —— React Query 把它记为 error state，
 * 用户看到的现象是「点了按钮没反应」，控制台里静静躺着一个 redirect 对象。
 *
 * 所以改成：执行器只抛类型化的 `ApiError`，由 React Query 的
 * QueryCache / MutationCache 全局 onError 统一决定跳转，这样 loader、mutation、
 * 手动 `await api.xxx()` 三条路径的行为完全一致。
 */

export type AuthRedirectTarget = '/login' | '/403'

type NavigateFn = (options: { to: AuthRedirectTarget }) => unknown
type RefreshFn = () => unknown

let navigateImpl: NavigateFn | null = null
let refreshImpl: RefreshFn | null = null

/** 由 `src/router.tsx` 在创建 router 之后注入，避免模块间循环依赖 */
export function registerAuthNavigate(fn: NavigateFn): void {
  navigateImpl = fn
}

/**
 * 同上，注入 `router.invalidate()`。跳登录页之前必须先把**路由上下文**里的 user 刷成最新值：
 * 用户信息现在只有路由上下文这一个来源（zustand store 已删），
 * cookie 已经失效而上下文里还是旧用户时，`/login` 的 `beforeLoad`（已登录就弹走）会把人弹回去。
 */
export function registerAuthRefresh(fn: RefreshFn): void {
  refreshImpl = fn
}

/** 多个 query 同时 401 时只跳一次 */
let lastRedirectAt = 0
const REDIRECT_COOLDOWN_MS = 1000

export async function handleApiError(error: unknown): Promise<void> {
  if (!(error instanceof ApiError)) {
    return
  }
  if (typeof window === 'undefined') {
    // SSR 阶段不跳转：服务端没有浏览器的历史栈，
    // 该场景下鉴权由 `_auth` / `admin` 的 `beforeLoad` 负责。
    return
  }
  if (!navigateImpl) {
    return
  }

  const target: AuthRedirectTarget | null = error.isUnauthorized
    ? '/login'
    : error.isForbidden
      ? '/403'
      : null

  if (!target) {
    return
  }

  const now = Date.now()
  if (now - lastRedirectAt < REDIRECT_COOLDOWN_MS) {
    return
  }
  lastRedirectAt = now

  if (error.isUnauthorized) {
    // 刷新路由上下文里的 user：cookie 已失效 → fetchUser() 返回 null。
    // 不刷新的话布局组件仍按「已登录」渲染（「已经跳到登录页但右上角还显示头像」），
    // 而且 /login 的 beforeLoad 会把刚跳过去的人弹回来。
    await refreshImpl?.()
  }

  navigateImpl({ to: target })
}
