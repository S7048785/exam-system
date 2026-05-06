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

  try {
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
      credentials: 'include', // 允许浏览器接收和发送 Cookie
    })

    if (response.status !== 200) {
      throw await response.json()
    }

    const text = await response.text()
    if (text.length === 0) {
      return null
    }
    return JSON.parse(text)

  } catch (error) {
    // 处理网络错误（后端未启动）
    console.error(`API请求失败 [${method}] ${uri}:`, error)

    // 返回一个默认的空数据结构，避免前端崩溃
    // 根据接口期望的返回类型返回对应结构
    return null
    // 或者返回 {}
    // 或者抛出一个可预期的错误，让业务层处理
    // throw new Error('网络连接失败，请检查后端服务是否启动')
  }
})