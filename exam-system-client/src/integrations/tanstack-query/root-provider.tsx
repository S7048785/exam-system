import { QueryClient } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
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
