import { cn } from '#/lib/utils.ts'

interface LoadingProps {
  /**
   * 外层容器类名。默认 `relative h-100`（400px 高的相对容器，适合嵌在卡片/对话框里）；
   * 整页加载传 `h-screen`。
   */
  className?: string
}

/**
 * 三柱跳动加载动画（原 styled-components `Loader` 的 Tailwind 版）。
 *
 * 动画本身写在 `styles/loading.css` 里（`@keyframes` 没法用工具类表达），
 * 这里只负责提供一个定位容器 —— 柱子以容器中心为基准对齐。
 */
export default function Loading({ className }: LoadingProps) {
  return (
    <div
      role="status"
      aria-label="加载中"
      className={cn('relative h-100', className)}
    >
      <div className="loading-bars" aria-hidden="true" />
    </div>
  )
}
