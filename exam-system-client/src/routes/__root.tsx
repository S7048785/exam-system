import { ProgressBar } from '#/components/ProgressBar.tsx'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Scripts,
} from '@tanstack/react-router'

import '@pitininja/cap-react-widget/dist/index.css'
import appCss from '../styles.css?url'

import { TooltipProvider } from '#/components/ui/tooltip'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'

interface MyRouterContext {
  queryClient: QueryClient
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
        {/* Ambient Background Blurs (Global) */}
        <div className="pointer-events-none fixed top-0 left-0 z-0 h-screen w-full overflow-hidden">
          {/* Top Left Blob: Gold/Stone hue in dark mode, subtle stone in light */}
          <div className="absolute top-[-10%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-stone-200/40 mix-blend-multiply blur-[100px] transition-colors duration-1000 dark:bg-amber-900/10 dark:mix-blend-screen"></div>

          {/* Bottom Right Blob: Jade/Moss hue */}
          <div className="absolute right-[-10%] bottom-[-10%] h-[50vw] w-[50vw] rounded-full bg-blue-100/40 mix-blend-multiply blur-[120px] transition-colors duration-1000 dark:bg-blue-900/15 dark:mix-blend-screen"></div>
        </div>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  )
}
