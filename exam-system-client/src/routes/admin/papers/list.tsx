import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { papersQueryOptions } from '#/features/admin/papers/paperQueries.ts'
import PaperInfoDialog from '#/features/admin/papers/list/EditDialog'
import { PaperFilters } from '#/features/admin/papers/list/PaperFilters.tsx'
import { PaperPagination } from '#/features/admin/papers/list/PaperPagination.tsx'
import PaperList from '#/features/admin/papers/list/body/PaperList.tsx'

export const Route = createFileRoute('/admin/papers/list')({
  component: PapersPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(papersQueryOptions({}))
  },
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: () => (
    <div className="p-8 text-center">加载试卷列表中...</div>
  ),
})

function PapersPage() {
  // 列表筛选条件
  const [filters, setFilters] = useState<{
    name?: string
  }>({
    name: undefined,
  })
  const [pageCondition, setPageCondition] = useState({
    page: 1,
    size: 10,
  })

  // 获取试卷列表
  const { data: listData, refetch } = useSuspenseQuery(
    papersQueryOptions(filters),
  )

  const papers = listData.data
  const total = listData.data.length

  // 筛选变化
  const handleFiltersChange = (newFilters: { name?: string }) => {
    setFilters(newFilters)
    setPageCondition({ ...pageCondition, page: 1 })
  }

  // 分页变化
  const handlePageChange = (newPage: number) => {
    setPageCondition({ ...pageCondition, page: newPage })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">试卷管理</h1>
        <p className="text-muted-foreground">管理所有试卷信息</p>
      </div>
      <PaperFilters
        values={filters}
        onChange={handleFiltersChange}
        onRefresh={refetch}
      />

      <PaperList papers={papers} />

      <PaperPagination
        size={pageCondition.size}
        page={pageCondition.page}
        total={total}
        onPageChange={handlePageChange}
        totalPages={total}
        onSizeChange={(newSize: number) => {
          setPageCondition({ ...pageCondition, size: newSize, page: 1 })
        }}
      />

      <PaperInfoDialog />
    </div>
  )
}
