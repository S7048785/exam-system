import {QueryClient} from '@tanstack/react-query'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,  // 不在窗口聚焦时重新获取数据
      }
    }
  })

  return {
    queryClient,
    user: null,
  }
}
export default function TanstackQueryProvider() {}
