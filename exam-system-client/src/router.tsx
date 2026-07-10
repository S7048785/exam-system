import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { getContext } from './integrations/tanstack-query/root-provider'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
  // 当 SSR 时，路由的 `loader` 里调用 `context.queryClient.ensureQueryData(...)` 预取数据，这些数据需要从服务端传到客户端。如果不加这个集成，SSR 时 server 端 fetch 的数据到了客户端就丢了，客户端会**重新发一次请求**，破坏了 SSR 的意义。
  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
