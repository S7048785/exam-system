import { getRequest } from '@tanstack/start-server-core'
import { Api } from './__generated'
import { redirect } from '@tanstack/react-router'

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
    console.error(await response.text())
    switch (response.status) {
      case 401:
        throw redirect({ to: '/sign-in' })
      case 403:
        throw redirect({ to: '/403' })
    }
  }

  const text = await response.text()
  return text.length === 0 ? null : JSON.parse(text)
})
