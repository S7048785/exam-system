import { createIsomorphicFn } from '@tanstack/react-start'

export interface BackendCall {
  /** 后端接口路径，不含 `/api` 上下文路径，例如 `/user/info` */
  path: string
  init: RequestInit
}

/**
 * 访问 Spring Boot 的唯一出口，也是全项目**唯一**需要区分「浏览器 / SSR」的地方。
 *
 * 为什么用 `createIsomorphicFn` 而不是 `typeof window` 判断：
 * TanStack Start 的编译器会在构建时把这个调用表达式**整体替换**成目标环境的实现
 * （见 `@tanstack/start-plugin-core/dist/esm/start-compiler/handleCreateIsomorphicFn.js`），
 * 也就是说浏览器产物里 `.server()` 那个函数节点根本不存在。带来的两个好处：
 *
 * 1. 后端地址、Cookie 转发逻辑不会进入客户端 bundle —— 既减小体积，
 *    也避免内网地址通过 `import.meta.env.VITE_API_URL` 被内联进 JS 泄露出去。
 * 2. 服务端专属的 `import` 不会被客户端打包器静态解析，不需要额外加 `optimizeDeps.exclude`。
 *
 * 另一个容易踩的坑：`api` 是模块级单例，在 SSR 时会被**同一个 Node 进程内的多个请求共享**。
 * 所以这里绝不能把 Cookie 缓存到模块作用域（下面每次调用都从 `getRequest()` 现取），
 * 否则 A 用户的请求会带上 B 用户的凭证。
 */
export const sendToBackend = createIsomorphicFn()
  .client(({ path, init }: BackendCall): Promise<Response> => {
    // 统一走同源相对路径：
    //   dev  → vite.config.ts 的 server.proxy 转发到 :8101
    //   prod → 由 nginx 等反向代理转发到后端
    // 同源意味着 Cookie 由浏览器自动携带，不需要任何手动处理。
    return fetch(`/api${path}`, { ...init, credentials: 'include' })
  })
  .server(async ({ path, init }: BackendCall): Promise<Response> => {
    // 动态 import：这条分支本就会在客户端构建时被剔除，动态 import 只是再上一层保险，
    // 不让打包器对该服务端专属模块产生任何静态依赖边。
    const { getRequest } = await import('@tanstack/react-start/server')
    const request = getRequest()

    const headers = new Headers(init.headers)

    // Sa-Token 把凭证放在 cookie `access_token` 里。SSR 阶段 Node 发出的请求默认是
    // 匿名的，必须手动透传浏览器 Cookie，否则服务端渲染时拿到的永远是 401。
    const cookie = request.headers.get('cookie')
    if (cookie) {
      headers.set('cookie', cookie)
    }

    // 透传真实来源，方便后端记录 IP / 排查问题
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      headers.set('x-forwarded-for', forwardedFor)
    }

    // 注意：环境变量的读取必须写在这个箭头函数**内部**。
    // 提到模块顶层会让该表达式在客户端构建时被静态内联，泄露后端地址。
    const origin: string | undefined =
      (typeof process !== 'undefined'
        ? (process.env.BACKEND_ORIGIN ?? process.env.VITE_API_URL)
        : undefined) ?? import.meta.env.VITE_API_URL

    if (!origin) {
      throw new Error(
        '未配置后端地址：请设置环境变量 BACKEND_ORIGIN，或在 .env 中配置 VITE_API_URL',
      )
    }

    return fetch(`${origin.replace(/\/+$/, '')}/api${path}`, {
      ...init,
      headers,
    })
  })
