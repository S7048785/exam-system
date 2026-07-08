import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type {
  QuestionSaveInput,
  QuestionsPageView,
  QuestionUpdateInput,
} from '#/__generated/model/static'
import QuestionTable from './QuestionTable'
import QuestionDrawer from './drawer/QuestionDrawer.tsx'
import ImportQuestionsDialog from './ImportQuestionsDialog/index'
import AiGenerateDialog from './AiGenerateDialog'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  categoryTreeQueryOptions,
  questionsQueryOptions,
} from '#/features/admin/questions/questionQueries.ts'
import { useImmer } from 'use-immer'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { DIFFICULTY_MAP, TYPE_MAP } from '#/types/questoin.ts'
import { Input } from '#/components/ui/input.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Plus, RotateCw, Sparkles, Upload } from 'lucide-react'
import { flattenCategories } from '#/features/admin/questions/utils.ts'

export interface QuestionListReq2 {
  page?: number | undefined
  size?: number | undefined
  categoryId?: number | undefined
  difficulty?: string | undefined
  type?: string | undefined
  keyword?: string | undefined
}

export default function QuestionsPage() {
  const [filters, setFilters] = useImmer<QuestionListReq2>({
    page: 1,
    size: 10,
  })

  // Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add')

  // 当前编辑的题目
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionsPageView | null>(null)

  // 导入弹窗状态
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // AI生成弹窗状态
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false)

  const handleAiDialog = () => {
    setAiGenerateDialogOpen((state) => !state)
  }

  // 获取分类树（静态数据）
  const { data: categoryData } = useSuspenseQuery(categoryTreeQueryOptions)
  const categories = categoryData.data

  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  )
  // 分类名称映射
  const categoryNameMap = useMemo(
    () => new Map(flatCategories.map((c) => [c.id, c.name])),
    [flatCategories],
  )

  // 获取题目列表（使用 useSuspenseQuery + loader 预取）
  const { data: listData, refetch } = useSuspenseQuery(
    questionsQueryOptions(filters),
  )

  const questions = listData.data.records
  const total = listData.data.total
  const page = listData.data.current
  const size = listData.data.size

  // 新增题目
  const addMutation = useMutation({
    mutationFn: (input: QuestionSaveInput) =>
      api.questionController.addQuestion({ body: input }),
    onSuccess: () => {
      refetch()
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
      refetch()
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
      refetch()
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
  // 分页变化
  const handlePageChange = (newPage: number) => {
    setFilters((draft) => {
      draft.page = newPage
    })
  }

  const handlePageSizeChange = (newSize: number) => {
    setFilters((draft) => {
      draft.size = newSize
      draft.page = 1
    })
  }

  const handleFiltersChange = (newFilters: QuestionListReq2) => {
    setFilters((draft) => {
      Object.assign(draft, newFilters)
      draft.page = 1
    })
  }

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex flex-wrap items-end gap-3">
        {/* 分类筛选 */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">分类</Label>
          <Select
            value={filters.categoryId?.toString() || 'all'}
            onValueChange={(val) =>
              handleFiltersChange({
                ...filters,
                categoryId: val === 'all' ? undefined : Number(val),
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {'　'.repeat(cat.level)}
                  {cat.level > 0 && '├ '}
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 难度筛选 */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">难度</Label>
          <Select
            value={filters.difficulty || 'all'}
            onValueChange={(val) =>
              handleFiltersChange({
                ...filters,
                difficulty: val === 'all' ? undefined : val,
              })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="全部难度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部难度</SelectItem>
              {Object.entries(DIFFICULTY_MAP).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 类型筛选 */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">类型</Label>
          <Select
            value={filters.type || 'all'}
            onValueChange={(val) =>
              handleFiltersChange({
                ...filters,
                type: val === 'all' ? undefined : val,
              })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {Object.entries(TYPE_MAP).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 关键词搜索 */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">关键词</Label>
          <Input
            placeholder="搜索题目..."
            className="w-48"
            value={filters.keyword || ''}
            onChange={(e) =>
              handleFiltersChange({
                ...filters,
                keyword: e.target.value || undefined,
              })
            }
          />
        </div>

        {/* 刷新按钮 */}
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RotateCw className="mr-1 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 操作栏 */}
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
          <Button size="sm" variant="outline" onClick={() => handleAiDialog()}>
            <Sparkles className="mr-1 h-4 w-4" />
            AI生成
          </Button>
          <Button size="sm" onClick={() => handleOpenAddDrawer()}>
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
