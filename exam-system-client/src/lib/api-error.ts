/**
 * 后端错误的统一载体。
 *
 * 后端约定（见 AGENTS.md）：
 * - 业务异常 `BusinessException` → HTTP 422，`text/plain`，body 是给用户看的提示文案
 * - 未登录 → HTTP 401
 * - 无权限 → HTTP 403
 *
 * 之所以要单独抽出来：422 的 body **不是 JSON**，如果直接 `response.json()`
 * 会抛 `SyntaxError`，把后端辛苦写的业务提示语整个吃掉，前端只能看到
 * "Unexpected token 'x' in JSON at position 0" 这种无意义报错。
 */
export class ApiError extends Error {
  readonly status: number
  readonly uri: string
  readonly payload: unknown

  constructor(status: number, uri: string, payload: unknown) {
    super(ApiError.toMessage(status, uri, payload))
    this.name = 'ApiError'
    this.status = status
    this.uri = uri
    this.payload = payload
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  private static toMessage(
    status: number,
    uri: string,
    payload: unknown,
  ): string {
    if (typeof payload === 'string' && payload.trim()) {
      return payload
    }
    if (payload && typeof payload === 'object') {
      const message = (payload as Record<string, unknown>).message
      if (typeof message === 'string' && message) {
        return message
      }
    }
    return `请求失败（HTTP ${status}）：${uri}`
  }
}

/**
 * 按 content-type 决定怎么读 body。
 *
 * - `application/json` → 解析为对象
 * - `text/plain`（含 422 业务错误）→ 原样返回字符串
 * - 空 body（如 204）→ null
 *
 * 对 content-type 不规范的接口做了兜底：若文本以 `{` / `[` 开头也尝试解析，
 * 避免后端漏设 content-type 时接口返回类型从对象退化成字符串。
 */
export function parseBody(text: string, contentType: string): unknown {
  if (text.length === 0) {
    return null
  }

  const looksLikeJson = contentType.includes('json')
  if (!looksLikeJson && !/^\s*[[{]/.test(text)) {
    return text
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
