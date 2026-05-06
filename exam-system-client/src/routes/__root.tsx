import {ProgressBar} from '#/components/ProgressBar.tsx'
import {createRootRouteWithContext, HeadContent, Link, Scripts,} from '@tanstack/react-router'

import '@pitininja/cap-react-widget/dist/index.css'
import appCss from '../styles.css?url'

import {TooltipProvider} from '#/components/ui/tooltip'
import type {QueryClient} from '@tanstack/react-query'
import {Toaster} from 'sonner'
import type {UserInfo} from "#/stores/user.ts";

interface MyRouterContext {
  queryClient: QueryClient
  user?: UserInfo
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

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
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  // 当路由不存在时显示这个组件
  notFoundComponent: () => {
    return (
      <div>
        <h2>404 - 页面没找到</h2>
        <p>抱歉，您访问的路径不存在。</p>
        <Link to="/">返回首页</Link>
      </div>
    )
  },
  // 当代码运行报错时显示
  errorComponent: ({ error }) => {
    return (
      <div>
        <h1>糟糕，出错了</h1>
        <pre>{error.message}</pre>
        <button onClick={() => window.location.reload()}>刷新试试</button>
      </div>
    )
  },
  beforeLoad: async  () => ({
    user: null,
  })
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere selection:bg-[rgba(79,184,178,0.24)]">
        <ProgressBar />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
        {/* <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        /> */}
        <Scripts />
      </body>
    </html>
  )
}
