// stores/userStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 用户信息类型定义
export interface UserInfo {
  id: string | number
  realName: string
  email?: string
  role?: string

  [key: string]: any // 允许其他扩展字段
}

// Store 状态类型定义
interface UserState {
  user: UserInfo | null
  isLoggedIn: boolean
}

// Store 动作类型定义
interface UserActions {
  setUser: (user: UserInfo) => void
  login: (user: UserInfo) => void
  logout: () => void
  updateUser: (userData: Partial<UserInfo>) => void
  clearUserStore: () => void
}

// 完整的 Store 类型
type UserStore = UserState & UserActions

// 初始状态
const initialState: UserState = {
  user: null,
  isLoggedIn: false,
}

// 创建 store
const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialState,

      // 设置用户信息
      setUser: (user) => set({ user, isLoggedIn: !!user }),

      // 登录方法
      login: (user) =>
        set({
          user,
          isLoggedIn: true,
        }),

      // 登出方法
      logout: () =>
        set({
          user: null,
          isLoggedIn: false,
        }),

      // 更新用户信息（部分更新）
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      // 清空整个 store
      clearUserStore: () => set(initialState),
    }),
    {
      name: 'user-storage', // localStorage 中存储的 key
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }), // 指定需要持久化的字段
    },
  ),
)

// 导出 store 和类型
export default useUserStore
