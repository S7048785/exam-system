import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type {
  QuestionListReq,
  QuestionSaveInput,
  QuestionsPageView,
  QuestionUpdateInput,
} from '#/__generated/model/static'
import QuestionTable from './QuestionTable'
import QuestionDrawer from './drawer/QuestionDrawer.tsx'
import ImportQuestionsDialog from './ImportQuestionsDialog/index'
import AiGenerateDialog from './AiGenerateDialog/Dialog.tsx'
import { useMemo, useState } from 'react'
import {
  categoryTreeQueryOptions,
  questionsQueryOptions,
} from '#/features/admin/questions/questionQueries.ts'
import {
  useAddQuestion,
  useDeleteQuestion,
  useUpdateQuestion,
} from './useQuestionActions'
import QuestionFilters from './QuestionFilters'
import { Button } from '#/components/ui/button.tsx'
import { Plus, Sparkles, Upload } from 'lucide-react'
import { flattenCategories } from '#/features/admin/questions/utils.ts'

export default function QuestionsPage() {
  const queryClient = useQueryClient()

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

  const { data: listData } = useSuspenseQuery(
    questionsQueryOptions({ ...searchFilters, ...pagination }),
  )
  const questions = listData.data.records
  const total = listData.data.total
  const page = listData.data.current
  const size = listData.data.size

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
        categories={categories}
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

      <QuestionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        question={selectedQuestion}
        onSubmit={handleSubmit}
        categories={categories}
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
