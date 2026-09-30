import type { RefObject } from 'react'
import('cap-widget')
const capUrl = import.meta.env.VITE_CAP_URL
const capSiteKey = import.meta.env.VITE_CAP_SITE_KEY

type CapWidgetProps = {
  ref: RefObject<any>
  onSetCaptchaToken: (token: string) => void
}
export default function CapWidget({ ref, onSetCaptchaToken }: CapWidgetProps) {

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
