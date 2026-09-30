import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { getContext } from './integrations/tanstack-query/root-provider'
import { registerAuthNavigate, registerAuthRefresh } from '#/lib/auth-redirect.ts'
import Loading from '#/components/Loading.tsx'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // 所有未自带 pendingComponent 的路由统一用这个加载动画
    defaultPendingComponent: () => <Loading className="h-screen" />,
  })
  // 把 router 注入给 React Query 的全局错误处理，用于 401/403 跳转。
  // 之所以要这样绕一下：root-provider 需要 router 的 navigate 能力，
  // 而 router 又依赖 root-provider 提供的 queryClient，直接互相 import 会形成循环依赖。
  registerAuthNavigate((options) => router.navigate(options))
  // 401 时要先把用户信息（路由上下文里的 user）刷成 null 再跳登录页，否则会被弹回来
  registerAuthRefresh(() => router.invalidate())
  // 当 SSR 时，路由的 `loader` 里调用 `context.queryClient.ensureQueryData(...)` 预取数据，这些数据需要从服务端传到客户端。如果不加这个集成，SSR 时 server 端 fetch 的数据到了客户端就丢了，客户端会**重新发一次请求**，破坏了 SSR 的意义。
  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
