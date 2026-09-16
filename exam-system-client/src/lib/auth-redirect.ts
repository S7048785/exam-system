import { ApiError } from '#/lib/api-error.ts'
import useUserStore from '#/stores/user.ts'

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

let navigateImpl: NavigateFn | null = null

/** 由 `src/router.tsx` 在创建 router 之后注入，避免模块间循环依赖 */
export function registerAuthNavigate(fn: NavigateFn): void {
  navigateImpl = fn
}

/** 多个 query 同时 401 时只跳一次 */
let lastRedirectAt = 0
const REDIRECT_COOLDOWN_MS = 1000

export function handleApiError(error: unknown): void {
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
    // 清掉本地 user，否则布局组件仍按「已登录」渲染，
    // 会出现「已经跳到登录页但右上角还显示头像」的错乱
    useUserStore.getState().logout()
  }

  navigateImpl({ to: target })
}
