// 服务器端初始化逻辑 - 不会被客户端导入
import {setServerCookieGetter} from '#/ApiInstance.ts'
import {getServerCookies} from '#/lib/api.server.ts'

// 在模块加载时初始化服务器端 cookie 获取器
if (typeof window === 'undefined') {
  setServerCookieGetter(getServerCookies)
}
