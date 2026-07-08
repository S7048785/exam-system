import { Api } from './__generated'
import { redirect } from '@tanstack/react-router'

// 由于 TanStack Start 有 SSR，SSR 阶段的 Node.js 环境不走 Vite proxy，需要保留直连 URL
const BASE_URL =
  typeof window !== 'undefined' ? '' : import.meta.env.VITE_API_URL

export const api = new Api(async ({ uri, method, headers, body }) => {
  const isFormData = body instanceof FormData

  const response = await fetch(`${BASE_URL}/api${uri}`, {
    method,
    body: body != null ? (isFormData ? body : JSON.stringify(body)) : undefined,
    headers: {
      ...(isFormData
        ? {}
        : { 'content-type': 'application/json;charset=UTF-8' }),
      ...headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    switch (response.status) {
      case 401:
        throw redirect({ to: '/sign-in' })
      case 403:
        throw redirect({ to: '/403' })
      default:
        throw await response.json()
    }
  }

  const text = await response.text()
  return text.length === 0 ? null : JSON.parse(text)
})
