// src/ApiInstance.ts
import {Api} from './__generated'

// 判断是否为客户端环境
const isClient = typeof window !== 'undefined'
const BASE_URL = import.meta.env.VITE_API_URL

// 导出全局变量`api`
export const api = new Api(async ({ uri, method, headers, body }) => {
  // 服务端渲染时 tenant 为 undefined
  const tenant = isClient
    ? ((window as any).__tenant as string | undefined)
    : undefined

  const isFormData = body instanceof FormData
  const response = await fetch(`${BASE_URL}${uri}`, {
    method,
    body:
      body !== undefined
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
    headers: {
      ...(isFormData
        ? {}
        : { 'content-type': 'application/json;charset=UTF-8' }),
      ...headers,
      ...(tenant !== undefined && tenant !== '' ? { tenant } : {}),
    },
  })
  if (response.status !== 200) {
    throw await response.json()
  }
  const text = await response.text()
  if (text.length === 0) {
    return null
  }
  return JSON.parse(text)
})
