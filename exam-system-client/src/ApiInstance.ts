// src/ApiInstance.ts
import {Api} from './__generated'

const isClient = typeof window !== 'undefined'
const BASE_URL = import.meta.env.VITE_API_URL

// 服务端 Cookie 获取器（会在运行时注入）
let serverCookieGetter: (() => Promise<string>) | null = null;

// 这个函数只能在服务端调用
export function setServerCookieGetter(getter: () => Promise<string>) {
	if (!isClient) {
		serverCookieGetter = getter;
	}
}

// 导出全局变量`api`
export const api = new Api(async ({ uri, method, headers, body }) => {
	const tenant = isClient
			? ((window as any).__tenant as string | undefined)
			: undefined

	const isFormData = body instanceof FormData

	let cookieHeader = '';

	// 服务端：使用注入的 cookie getter
	if (!isClient && serverCookieGetter) {
		cookieHeader = await serverCookieGetter();
	}

	const response = await fetch(`${BASE_URL}${uri}`, {
		method,
		body: body !== undefined
				? isFormData ? body : JSON.stringify(body)
				: undefined,
		headers: {
			...(isFormData ? {} : { 'content-type': 'application/json;charset=UTF-8' }),
			...headers,
			...(tenant !== undefined && tenant !== '' ? { tenant } : {}),
			// 注意：fetch 的 Cookie 头应该用 "Cookie"，不是 "cookies"
			...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
		},
		credentials: 'include',
	})

	if (response.status !== 200) {
		console.error(`API请求失败 [${method}] ${uri}:`, response.statusText)
		throw await response.json()
	}

	const text = await response.text()
	if (text.length === 0) {
		return null
	}
	return JSON.parse(text)
})