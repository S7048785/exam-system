import { getRequest } from '@tanstack/start-server-core'
import { Api } from './__generated'

const BASE_URL = import.meta.env.VITE_API_URL

export const serverApi = new Api(async ({ uri, method, headers, body }) => {
  const request = getRequest()
  const cookie = request.headers.get('cookie') || ''

  const isFormData = body instanceof FormData

  const newHeaders: HeadersInit = {
    ...(isFormData ? {} : { 'content-type': 'application/json;charset=UTF-8' }),
    cookie,
    ...headers,
  }

  const response = await fetch(`${BASE_URL}/api${uri}`, {
    method,
    body: body != null ? (isFormData ? body : JSON.stringify(body)) : undefined,
    headers: newHeaders,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }

  const text = await response.text()
  return text.length === 0 ? null : JSON.parse(text)
})
