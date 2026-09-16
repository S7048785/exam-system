import { Api } from './__generated'
import { ApiError, parseBody } from '#/lib/api-error.ts'
import { sendToBackend } from '#/lib/backend.ts'

/**
 * 生成的 API 客户端。这里只负责「把业务参数翻译成一次 HTTP 请求」，
 * 不关心自己跑在浏览器还是 Node 里 —— 环境差异全部收敛在 `sendToBackend`。
 *
 * 也因此这里不再出现：`typeof window`、`import.meta.env`、动态 import、
 * `throw redirect`（详见 `#/lib/auth-redirect.ts` 的说明）。
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
    // 必须先把 body 当文本读出来：422 的业务错误是 text/plain，不能直接 .json()
    throw new ApiError(response.status, uri, parseBody(text, contentType))
  }

  return parseBody(text, contentType)
})
