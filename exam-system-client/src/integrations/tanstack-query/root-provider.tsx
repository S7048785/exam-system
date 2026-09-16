import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { handleApiError } from '#/lib/auth-redirect.ts'

function makeQueryClient() {
  return new QueryClient({
    // 401 / 403 的统一兜底：见 #/lib/auth-redirect.ts
    // 放在这里而不是 fetch 执行器里，是为了让 loader、mutation、手动 await 行为一致
    queryCache: new QueryCache({ onError: handleApiError }),
    mutationCache: new MutationCache({ onError: handleApiError }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30 * 1000,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getContext() {
  if (typeof window === 'undefined') {
    return { queryClient: makeQueryClient(), user: null }
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return { queryClient: browserQueryClient, user: null }
}

export default function TanstackQueryProvider() {}
