import { useTheme } from 'next-themes'
import type { ToasterProps } from 'sonner'
import { Toaster as Sonner } from 'sonner'

import { Check, CircleAlert, CircleX, Info, Loader } from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <Check strokeWidth={2} className="size-4" />,
        info: <Info strokeWidth={2} className="size-4" />,
        warning: <CircleAlert strokeWidth={2} className="size-4" />,
        error: <CircleX strokeWidth={2} className="size-4" />,
        loading: <Loader strokeWidth={2} className="size-4" animate-spin />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
