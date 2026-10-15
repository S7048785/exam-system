import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '#/ApiInstance.ts'
import { paperReportsQueryOptions } from '#/features/console/papers/report/paperReportQueries.ts'
import {
  PaperReportFilters,
  type ReportFilterType,
} from '#/features/console/papers/report/PaperReportFilters.tsx'
import { PaperReportTable } from '#/features/console/papers/report/PaperReportTable.tsx'
import { PaperPagination } from '#/features/console/papers/list/PaperPagination.tsx'
import Loading from '#/components/Loading.tsx'
import type { PaperReportListQuery } from '#/__generated/model/static'

/**
 * 「人工判卷」控制台页：按试卷维度看 交卷 / 未评 / 已评 计数，从行操作进判卷。
 *
 * 数据来自 `GET /paper/report/list`（`PageRes<PaperReportView>`，**不套 `R`**）。
 * 分页参数 `size` 后端限 10~50，所以下面的选项只有 10/20/50 —— 别加其它值，会 422。
 */
const DEFAULT_FILTERS: ReportFilterType = {
  name: '',
  categoryId: undefined,
  startFrom: undefined,
  startTo: undefined,
  endFrom: undefined,
  endTo: undefined,
}

const DEFAULT_PAGINATION = { page: 1, size: 10 }

export const Route = createFileRoute('/_auth/papers/report')({
  component: PaperReportPage,
  // loader 必须把 ensureQueryData 的 Promise return 出去（否则 SSR 跳转/错误边界都救不回来）
  loader: async ({ context }) =>
    context.queryClient.ensureQueryData(
      paperReportsQueryOptions({ ...DEFAULT_FILTERS, ...DEFAULT_PAGINATION }),
    ),
})

function PaperReportPage() {
  const [filters, setFilters] = useState<ReportFilterType>(DEFAULT_FILTERS)
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)

  // 分类树（与试卷列表共用同一个 queryKey，切页不重复请求）
  const { data: treeData } = useQuery({
    queryKey: ['paper-category-tree'],
    queryFn: () => api.paperCategoryController.tree(),
  })
  const categoryTree = treeData?.data ?? []

  const queryParams: PaperReportListQuery = useMemo(
    () => ({ ...filters, ...pagination }),
    [filters, pagination],
  )
  const { data: listData, isPending } = useQuery(
    paperReportsQueryOptions(queryParams),
  )

  const queryClient = Route.useRouteContext().queryClient
  const handleRefresh = () => {
    setPagination((state) => ({ ...state, page: 1 }))
    queryClient.invalidateQueries({ queryKey: ['listPaperReports'] })
  }

  const handleFiltersChange = (next: ReportFilterType) => {
    setFilters(next)
    // 条件变了必须回第 1 页，否则可能停在越界页上拿到空列表
    setPagination((state) => ({ ...state, page: 1 }))
  }

  const total = listData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pagination.size))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">人工判卷</h1>
        <p className="text-muted-foreground">
          按试卷查看交卷 / 未评 / 已评情况，点「去判卷」进入该卷的成绩列表
        </p>
      </div>

      <PaperReportFilters
        values={filters}
        onChange={handleFiltersChange}
        onRefresh={handleRefresh}
        categoryTree={categoryTree}
      />

      {isPending ? (
        <Loading />
      ) : listData?.list.length ? (
        <>
          <PaperReportTable items={listData.list} />
          <PaperPagination
            size={pagination.size}
            page={pagination.page}
            total={total}
            totalPages={totalPages}
            onPageChange={(page) =>
              setPagination((state) => ({ ...state, page }))
            }
            onSizeChange={(size) => setPagination({ page: 1, size })}
          />
        </>
      ) : (
        <div className="text-muted-foreground flex h-60 items-center justify-center rounded-md border border-dashed text-sm">
          没有符合条件的试卷，试试放宽筛选条件
        </div>
      )}
    </div>
  )
}
