import { SectionCards } from '#/components/section-cards.tsx'
import { Suspense, lazy } from 'react'
// 1. 使用 React.lazy 懒加载组件
// 建议创建一个包装组件或者直接异步导入数据
const LazyDataTable = lazy(() =>
    Promise.all([
      import('#/components/data-table.tsx'),
      import('#/lib/data.json')
    ]).then(([module, dataModule]) => {
      // 返回一个符合 React.lazy 要求的 default 导出
      return {
        default: (props: any) => <module.DataTable data={dataModule.default} {...props} />
      }
    })
)
const LazyChartAreaInteractive = lazy(() =>
  Promise.all([
      import("#/components/chart-area-interactive.tsx")
  ]).then(([module]) => {
    return {
      default: () => <module.ChartAreaInteractive/>
    }
  })
)
export default function DashboardPage() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <LazyChartAreaInteractive />
      </div>
      {/* 2. 使用 Suspense 包裹懒加载组件 */}
      <Suspense fallback={<DataTablePlaceholder />}>
        <LazyDataTable />
      </Suspense>
    </>
  )
}
// 3. 简单的占位组件（骨架屏）
function DataTablePlaceholder() {
  return (
      <div className="p-4 space-y-3">
        <div className="h-8 w-full animate-pulse rounded" />
        <div className="h-64 w-full animate-pulse rounded" />
      </div>
  )
}
