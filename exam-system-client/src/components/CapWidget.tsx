import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

const capUrl = import.meta.env.VITE_CAP_URL
const capSiteKey = import.meta.env.VITE_CAP_SITE_KEY

type CapWidgetProps = {
  ref: RefObject<any>
  onSetCaptchaToken: (token: string) => void
}
export default function CapWidget({ ref, onSetCaptchaToken }: CapWidgetProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    import('cap-widget').then(() => setReady(true))
  }, [])

  // 验证码样式
  useEffect(() => {
    if (!ready) return
    const cap = document.querySelector('cap-widget')
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(`
      .label {
        position: static !important;
      }
        .captcha {
        display: flex;
        justify-content: center;
    }
    `)
    if (cap) {
      cap.shadowRoot!.adoptedStyleSheets = [sheet]
    }
  }, [ready])

  if (!ready) {
    return (
      <div className="border-border flex h-[50px] w-[382px] items-center justify-center border">
        <span className="text-muted-foreground text-xs">加载中...</span>
      </div>
    )
  }

  return (
    <>
      {/* @ts-ignore: 忽略 cap-widget 组件的类型检查错误 */}
      <cap-widget
        ref={ref}
        id={'cap'}
        required
        data-cap-i18n-initial-state="我不是机器人"
        data-cap-i18n-solved-label="验证通过"
        data-cap-i18n-verifying-label="验证中..."
        data-cap-i18n-required-label="请验证您是人类用户"
        data-cap-api-endpoint={`${capUrl}/${capSiteKey}`}
        onsolve={(e: any) => {
          onSetCaptchaToken(e.detail.token)
        }}
        onerror={(e: any) => console.error(e.detail.message)}
      />
    </>
  )
}
