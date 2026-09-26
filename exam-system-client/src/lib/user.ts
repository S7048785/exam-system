/**
 * 登录用户信息。
 *
 * 原先定义在 `stores/user.ts`（zustand + persist）；2026-09-26 起用户信息统一由**路由上下文**提供
 * （`__root.tsx` 的 `beforeLoad` → `createServerFn` → `userController.getUserInfo()`），
 * 那个 store 已删除，类型搬到这里给 `MyRouterContext` / `redirectIfAuthenticated` 用。
 *
 * ⚠️ 后端 `UserController/USER_INFO`（`src/__generated/model/dto/UsersDto.ts`）只返回
 * `id / email / realName / role`，**没有 `avatar`**；这里保留索引签名是为了兼容各页面
 * 既有的 `user.avatar` 写法（实际拿到的是 undefined，头像渲染出来是首字母兜底）。
 */
export interface UserInfo {
  id: string | number
  realName: string
  email?: string
  role?: string

  [key: string]: any // 允许其他扩展字段
}
