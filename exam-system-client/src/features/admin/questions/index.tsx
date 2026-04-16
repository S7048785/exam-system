import {  useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type {
  QuestionListReq,
  QuestionSaveInput,
  QuestionUpdateInput,
  QuestionsPageView,
} from '#/__generated/model/static'
import QuestionTable from './QuestionTable'
import QuestionDrawer from './QuestionDrawer'
import ImportQuestionsDialog from './ImportQuestionsDialog/index'
import AiGenerateDialog from './AiGenerateDialog'
import { useState } from 'react'
import { toast } from 'sonner'
import {categoryTreeQueryOptions, questionsQueryOptions} from "#/features/admin/questions/questionQueries.ts";
import {useNavigate, useSearch} from "@tanstack/react-router";

export default function QuestionsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
   // 列表筛选条件
  const filters = useSearch({ from: '/admin/questions' })

  // Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add')

  // 当前编辑的题目
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionsPageView | null>(null)

  // 导入弹窗状态
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // AI生成弹窗状态
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false)

  const handleAiDialog = () => {
    setAiGenerateDialogOpen(state => !state)
  }

  // 获取分类树（静态数据）
  const { data: categoryData } = useSuspenseQuery(categoryTreeQueryOptions)
  const categories = categoryData.data ?? []

  // 获取题目列表（使用 useSuspenseQuery + loader 预取）
  const { data: listData, refetch } = useSuspenseQuery(questionsQueryOptions(filters))

  const questions = listData.data?.records ?? []
  const total = listData.data?.total ?? 0
  const page = listData.data?.current ?? 1
  const size = listData.data?.size ?? 10

  // 新增题目
  const addMutation = useMutation({
    mutationFn: (input: QuestionSaveInput) =>
      api.questionController.addQuestion({ body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      toast.success('题目添加成功')
    },
    onError: () => {
      toast.error('添加题目失败')
    },
  })

  // 更新题目
  const updateMutation = useMutation({
    mutationFn: (input: QuestionUpdateInput) =>
      api.questionController.updateQuestion({ body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
      toast.success('题目更新成功')
    },
    onError: () => {
      toast.error('更新题目失败')
    },
  })

  // 删除题目
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.questionController.removeQuestion({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
    onError: () => {
      toast.error('删除题目失败')
    },
  })

  // 打开新增 Drawer
  const handleOpenAddDrawer = () => {
    setDrawerMode('add')
    setSelectedQuestion(null)
    setDrawerOpen(true)
  }

  // 打开编辑 Drawer
  const handleOpenEditDrawer = (question: QuestionsPageView) => {
    setDrawerMode('edit')
    setSelectedQuestion(question)
    setDrawerOpen(true)
  }

  // 提交表单
  const handleSubmit = (values: QuestionSaveInput | QuestionUpdateInput) => {
    if (drawerMode === 'add') {
      addMutation.mutate(values as QuestionSaveInput)
    } else {
      updateMutation.mutate(values as QuestionUpdateInput)
    }
    setDrawerOpen(false)
  }

  // 删除题目
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }
// 分页 / 筛选变化 → 更新 URL（推荐方式）
  const updateFilters = (newFilters: Partial<QuestionListReq>) => {
    navigate({
      to: '/admin/questions',
      search: (prev) => ({ ...prev, ...newFilters, page: newFilters.page ?? 1 }),
      replace: true,
    })
  }
  // 分页变化
  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage })
  }

  const handlePageSizeChange = (newSize: number) => {
    updateFilters({ size: newSize, page: 1 })
  }

  const handleFiltersChange = (newFilters: QuestionListReq) => {
    updateFilters({ ...newFilters, page: 1 })
  }

  return (
    <div className="space-y-4">
      <QuestionTable
        data={questions}
        total={total}
        page={page}
        size={size}
        filters={filters}
        categories={categories}
        onRefresh={() => refetch()}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onFiltersChange={handleFiltersChange}
        onAdd={handleOpenAddDrawer}
        onEdit={handleOpenEditDrawer}
        onDelete={handleDelete}
        onImport={() => setImportDialogOpen(true)}
        onAiGenerate={handleAiDialog}
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
        onImportSuccess={() => refetch()}
      />

      <AiGenerateDialog
        open={aiGenerateDialogOpen}
        onOpenChange={handleAiDialog}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
