import { Api } from './__generated'
import { redirect } from '@tanstack/react-router'

// 浏览器端走 Vite proxy (/api → localhost:8101)，使用相对路径
// 服务端 SSR 阶段直接连接后端
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
