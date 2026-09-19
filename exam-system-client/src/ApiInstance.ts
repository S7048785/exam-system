import { Api } from './__generated'
import { ApiError, parseBody } from '#/lib/api-error.ts'
import { sendToBackend } from '#/lib/backend.ts'
import {redirect} from "@tanstack/react-router";

/**
 * 生成的 API 客户端。这里只负责「把业务参数翻译成一次 HTTP 请求」，
 * 不关心自己跑在浏览器还是 Node 里 —— 环境差异全部收敛在 `sendToBackend`。
 *
 * 403（角色不足）直接 `throw redirect({ to: '/login' })`：
 * 只要这次调用是在 `beforeLoad` / `loader`（含服务端 SSR）里发起的，TanStack Router 就会
 * 把它当成跳转处理 —— 前提是 loader **必须把 `ensureQueryData` 的 Promise return 出去**
 * （不 return 的话错误会跑到 React 外面，跳转和 errorComponent 都救不回来）。
 *
 * ⚠️ 从 `useMutation` 的 mutationFn、或客户端的 `useQuery` 里抛出时，React Query 只会把它
 * 记成 error state（`onError` 收到的是个 redirect 对象，不是 `ApiError`），不会跳转。
 * 这条路径的统一处理仍由 `#/lib/auth-redirect.ts` 负责。
 */
export const api = new Api(async ({ uri, method, headers, body }) => {
  const isFormData = body instanceof FormData

  const response = await sendToBackend({
    path: uri,
    init: {
      method,
      body: body == null ? undefined : isFormData ? body : JSON.stringify(body),
      headers: {
        ...(isFormData
          ? {}
          : { 'content-type': 'application/json;charset=UTF-8' }),
        ...headers,
      },
    },
  })

  const text = await response.text()
  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    console.log(new ApiError(response.status, uri, parseBody(text, contentType)), uri)
    if (response.status === 403) {
      throw redirect({ to: '/login' })
    }
    throw redirect({ to: '/error' })
    // 必须先把 body 当文本读出来：422 的业务错误是 text/plain，不能直接 .json()
    // throw new ApiError(response.status, uri, parseBody(text, contentType))
  }

  return parseBody(text, contentType)
})
