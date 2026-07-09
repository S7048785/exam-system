import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useChangeStatus,
  useDeleteMutation,
} from '#/features/admin/papers/usePaperActions.ts'
import type { PaperStatus } from '#/__generated/model/enums'
import { papersQueryOptions } from '#/features/admin/papers/paperQueries.ts'
import PaperTable from '#/features/admin/papers/components/PaperTable.tsx'

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
  const navigate = useNavigate()

  // 列表筛选条件
  const [filters, setFilters] = useState<{
    name?: string
    status?: PaperStatus
  }>({
    name: undefined,
    status: undefined,
  })
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)

  // 获取试卷列表
  const { data: listData, refetch } = useSuspenseQuery(
    papersQueryOptions({ ...filters, name: filters.name || undefined }),
  )

  const papers = listData.data
  const total = listData.data.length

  // 更新试卷状态
  const changeStatusMutation = useChangeStatus()

  // 删除试卷
  const deleteMutation = useDeleteMutation()

  // 筛选变化
  const handleFiltersChange = (newFilters: {
    name?: string
    status?: PaperStatus
  }) => {
    setFilters(newFilters)
    setPage(1)
  }

  // 分页变化
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // 新增
  const handleAdd = () => {
    navigate({ to: '/admin/papers/create' })
  }

  // 编辑
  const handleEdit = (id: number) => {
    navigate({ to: '/admin/papers/$id/edit', params: { id: id.toString() } })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">试卷管理</h1>
        <p className="text-muted-foreground">管理所有试卷信息</p>
      </div>
      <PaperTable
        filters={{
          name: filters.name,
          status: filters.status,
        }}
        onAction={{
          refresh: () => refetch(),
          sizeChange: (newSize: number) => {
            setSize(newSize)
            setPage(1)
          },
          pageChange: handlePageChange,
          filterChange: handleFiltersChange,
          add: handleAdd,
          edit: handleEdit,
          delete: (id) => deleteMutation.mutate(id),
          changeStatus: (param) => changeStatusMutation.mutate(param),
        }}
        pagination={{
          data: papers,
          total,
          page,
          size,
        }}
      />
    </div>
  )
}
