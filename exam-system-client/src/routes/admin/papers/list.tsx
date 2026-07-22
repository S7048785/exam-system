import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '#/ApiInstance.ts'
import { papersQueryOptions } from '#/features/admin/papers/paperQueries.ts'
import PaperInfoDialog from '#/features/admin/papers/list/EditDialog'
import { PaperFilters } from '#/features/admin/papers/list/PaperFilters.tsx'
import { PaperPagination } from '#/features/admin/papers/list/PaperPagination.tsx'
import PaperList from '#/features/admin/papers/list/body/PaperList.tsx'
import type { PaperListQuery } from '#/__generated/model/static'
import { usePaperListStore } from '#/stores/paper-list.ts'
import { Button } from '#/components/ui/button.tsx'
import { Plus } from 'lucide-react'
import Loading from '#/components/Loading.tsx'

export const Route = createFileRoute('/admin/papers/list')({
  component: PapersPage,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      papersQueryOptions({
        name: '',
        page: 1,
        size: 10,
        categoryId: undefined,
        ongoing: undefined,
      }),
    )
  },
})

export type PageListFilterType = Omit<PaperListQuery, 'page' & 'size'>

function CreatePaper() {
  const addPaper = usePaperListStore((state) => state.addPaper)
  return (
    <Button onClick={addPaper} className="gap-1.5">
      <Plus className="h-4 w-4" />
      新增试卷
    </Button>
  )
}

function PapersPage() {
  // 列表筛选条件
  const [filters, setFilters] = useState<PageListFilterType>({
    name: '',
    categoryId: undefined,
    ongoing: undefined,
  })
  const [pageCondition, setPageCondition] = useState({
    page: 1,
    size: 10,
  })

  // 分类树
  const { data: treeData } = useQuery({
    queryKey: ['paper-category-tree'],
    queryFn: () => api.paperCategoryController.tree(),
  })
  const categoryTree = treeData?.data ?? []

  // 获取试卷列表
  const queryParams: PaperListQuery = useMemo(
    () => ({ ...filters, ...pageCondition }),
    [filters, pageCondition],
  )
  const { data: listData, isPending } = useQuery(
    papersQueryOptions(queryParams),
  )

  const handleRefresh = () => {
    setPageCondition((state) => ({ ...state, page: 1 }))
    // q.invalidateQueries({queryKey: ['']})
  }

  // 筛选变化
  const handleFiltersChange = (newFilters: PageListFilterType) => {
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
      <div className="flex items-end justify-between">
        <PaperFilters
          values={filters}
          onChange={handleFiltersChange}
          onRefresh={handleRefresh}
          categoryTree={categoryTree}
        />
        <CreatePaper />
      </div>
      {isPending ? (
        <Loading />
      ) : listData?.data.at(0) ? (
        <>
          <PaperList papers={listData.data} />

          <PaperPagination
            size={pageCondition.size}
            page={pageCondition.page}
            total={listData.data.length}
            onPageChange={handlePageChange}
            totalPages={listData.data.length}
            onSizeChange={(newSize: number) => {
              setPageCondition({ ...pageCondition, size: newSize, page: 1 })
            }}
          />
        </>
      ) : (
        <div className="relative h-100">
          <div className="absolute top-1/2 left-1/2 -translate-x-2/3 -translate-y-1/2 space-y-4 text-center">
            <p>无符合条件的试卷</p>
            <p>点击创建按钮，去组织发布考试</p>
            <CreatePaper />
          </div>
        </div>
      )}

      <PaperInfoDialog />
    </div>
  )
}
