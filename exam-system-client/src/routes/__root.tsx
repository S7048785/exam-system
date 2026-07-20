import { ProgressBar } from '#/components/ProgressBar.tsx'
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import '@pitininja/cap-react-widget/dist/index.css'
import appCss from '../styles/styles.css?url'

import { TooltipProvider } from '#/components/ui/tooltip'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import type { UserInfo } from '#/stores/user.ts'
import { createServerFn } from '@tanstack/react-start'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { api } from '#/ApiInstance.ts'
import { ClientOnly } from '#/components/ClientOnly.tsx'

interface MyRouterContext {
  queryClient: QueryClient
  user: UserInfo | null
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  // We need to auth on the server so we have access to secure cookies
  try {
    const user = await api.userController.getUserInfo()
    return user.data
  } catch (error) {
    console.error(error)
    return null
  }
})

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: '在线考试系统云平台',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  beforeLoad: async () => {
    const user = await fetchUser()
    return {
      user,
    }
  },
  shellComponent: RootDocument,
  // 当代码运行报错时显示
  errorComponent: ({ error }) => {
    return (
      <div>
        <pre>{error.message}</pre>
      </div>
    )
  },
  pendingComponent: () => {
    return <div>加载中</div>
  },
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans wrap-anywhere antialiased">
        <ProgressBar />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
        <Scripts />
        {import.meta.env.DEV && (
          <ClientOnly>
            <ReactQueryDevtools buttonPosition="top-right" />
            <TanStackRouterDevtools position="bottom-right" />
          </ClientOnly>
        )}
      </body>
    </html>
  )
}
