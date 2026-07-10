import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import type {
  QuestionListReq,
  QuestionSaveInput,
  QuestionsPageView,
  QuestionUpdateInput,
} from '#/__generated/model/static'
import { useMemo, useState } from 'react'
import {
  categoryTreeQueryOptions,
  questionsQueryOptions,
} from '#/features/admin/questions/questionQueries.ts'

import { Button } from '#/components/ui/button.tsx'
import { Loader2, Plus, Sparkles, Upload } from 'lucide-react'
import { flattenCategories } from '#/features/admin/questions/utils.ts'
import {
  useAddQuestion,
  useDeleteQuestion,
  useUpdateQuestion,
} from '#/features/admin/questions/useQuestionActions.ts'
import QuestionFilters from '#/features/admin/questions/components/QuestionFilters.tsx'
import QuestionTable from '#/features/admin/questions/components/QuestionTable.tsx'
import QuestionDrawer from '#/features/admin/questions/components/drawer/QuestionDrawer.tsx'
import ImportQuestionsDialog from '#/features/admin/questions/components/ImportQuestionsDialog'
import AiGenerateDialog from '#/features/admin/questions/components/AiGenerateDialog/Dialog.tsx'

export const Route = createFileRoute('/admin/questions')({
  component: QuestionsPage,
  loader: async ({ context }) => {
    // 提前预取分类（静态，几乎不影响性能）
    context.queryClient.ensureQueryData(categoryTreeQueryOptions)
    // 提前预取题目列表（使用当前 search 参数）
    // context.queryClient.ensureQueryData(
    //   questionsQueryOptions({
    //     page: 1,
    //     size: 10,
    //   }),
    // )
  },
  pendingComponent: () => {
    return <div>加载中</div>
  },
  // pendingMs: 0, // 设置为0, 只要路由跳转，立刻显示 pendingComponent
  // pendingMinMs: 0, // pendingComponent最小显示时间
  // pendingComponent: () => (
  //   <div className="p-8 text-center">加载题目列表中...</div>
  // ), // 可替换成骨架屏
})

export default function QuestionsPage() {
  const queryClient = Route.useRouteContext().queryClient

  const [pagination, setPagination] = useState({ page: 1, size: 10 })
  const [searchFilters, setSearchFilters] = useState<
    Omit<QuestionListReq, 'page' | 'size'>
  >({})

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add')
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionsPageView | null>(null)

  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false)
  const handleAiDialog = () => {
    setAiGenerateDialogOpen((state) => !state)
  }

  const { data: categoryData } = useSuspenseQuery(categoryTreeQueryOptions)
  const categories = categoryData.data

  const categoryNameMap = useMemo(() => {
    const flat = flattenCategories(categories)
    return new Map(flat.map((c) => [c.id, c.name]))
  }, [categories])

  const { data: listData, isFetching } = useQuery(
    questionsQueryOptions({ ...searchFilters, ...pagination }),
  )
  const questions = listData?.data.records ?? []
  const total = listData?.data.total ?? 0
  const page = listData?.data.current ?? 1
  const size = listData?.data.size ?? pagination.size

  const addMutation = useAddQuestion(() => setDrawerOpen(false))
  const updateMutation = useUpdateQuestion(() => setDrawerOpen(false))
  const deleteMutation = useDeleteQuestion()

  const handleOpenAddDrawer = () => {
    setDrawerMode('add')
    setSelectedQuestion(null)
    setDrawerOpen(true)
  }

  const handleOpenEditDrawer = (question: QuestionsPageView) => {
    setDrawerMode('edit')
    setSelectedQuestion(question)
    setDrawerOpen(true)
  }

  const handleSubmit = (values: QuestionSaveInput | QuestionUpdateInput) => {
    if (drawerMode === 'add') {
      addMutation.mutate(values as QuestionSaveInput)
    } else {
      updateMutation.mutate(values as QuestionUpdateInput)
    }
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newSize: number) => {
    setPagination({ page: 1, size: newSize })
  }

  const handleFiltersChange = (
    newFilters: Omit<QuestionListReq, 'page' | 'size'>,
  ) => {
    setSearchFilters(newFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const invalidateQuestions = () => {
    queryClient.invalidateQueries({ queryKey: ['questions'] })
  }

  return (
    <div className="space-y-4">
      <QuestionFilters
        values={searchFilters}
        onChange={handleFiltersChange}
        onRefresh={invalidateQuestions}
      />

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">共 {total} 道题目</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="mr-1 h-4 w-4" />
            导入
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAiGenerateDialogOpen(true)}
          >
            <Sparkles className="mr-1 h-4 w-4" />
            AI生成
          </Button>
          <Button size="sm" onClick={handleOpenAddDrawer}>
            <Plus className="mr-1 h-4 w-4" />
            新增题目
          </Button>
        </div>
      </div>

      <div className="relative">
        {isFetching && (
          <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        )}
        <QuestionTable
          data={questions}
          total={total}
          page={page}
          size={size}
          categoryNameMap={categoryNameMap}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleOpenEditDrawer}
          onDelete={handleDelete}
        />
      </div>

      <QuestionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        question={selectedQuestion}
        onSubmit={handleSubmit}
      />

      <ImportQuestionsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSuccess={invalidateQuestions}
      />

      <AiGenerateDialog
        open={aiGenerateDialogOpen}
        onOpenChange={handleAiDialog}
        onSuccess={invalidateQuestions}
      />
    </div>
  )
}
