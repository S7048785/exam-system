import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import { useState } from 'react'
import { paperCategoryTreeOptions } from './paperCategoryQueries.ts'
import type {
  PaperCategoriesTree,
  PaperCategorySaveInput,
  PaperCategoryUpdateInput,
} from '#/__generated/model/static'
import PaperCategoryTable from './PaperCategoryTable.tsx'
import PaperCategoryDrawer from './PaperCategoryDrawer.tsx'

export default function PaperCategoriesPage() {
  // 展开的分类 ID 集合
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // 选中的分类（用于编辑）
  const [selectedCategory, setSelectedCategory] =
    useState<PaperCategoriesTree | null>(null)

  // Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add')
  const [drawerParentId, setDrawerParentId] = useState<number>(0)

  // 获取树形数据
  const { data: treeData, refetch } = useSuspenseQuery(paperCategoryTreeOptions)

  // 新增分类
  const addMutation = useMutation({
    mutationFn: (input: PaperCategorySaveInput) =>
      api.paperCategoryController.addCategory({ body: input }),
    onSuccess: () => {
      refetch()
    },
  })

  // 更新分类
  const updateMutation = useMutation({
    mutationFn: ({ input }: { input: PaperCategoryUpdateInput }) =>
      api.paperCategoryController.updateCategory({ body: input }),
    onSuccess: () => {
      refetch()
    },
  })

  // 删除分类
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.paperCategoryController.removeCategory({ id }),
    onSuccess: () => {
      refetch()
    },
  })

  // 切换展开/折叠
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  // 打开新增 Drawer
  const handleOpenAddDrawer = (parentId: number) => {
    setDrawerMode('add')
    setDrawerParentId(parentId)
    setDrawerOpen(true)
  }

  // 打开编辑 Drawer
  const handleOpenEditDrawer = (category: PaperCategoriesTree) => {
    setSelectedCategory(category)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  // 提交表单
  const handleSubmit = (values: {
    name: string
    sort: number
    description: string
  }) => {
    if (drawerMode === 'add') {
      addMutation.mutate({
        name: values.name,
        parentId: drawerParentId,
        sort: values.sort,
        description: values.description,
      })
    } else if (selectedCategory) {
      updateMutation.mutate({
        input: {
          id: selectedCategory.id,
          name: values.name,
          parentId: selectedCategory.parentId,
          sort: values.sort,
          description: values.description,
        },
      })
    }
    setDrawerOpen(false)
  }

  // 删除分类
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const categories = treeData.data

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">试卷分类管理</h1>
        <p className="text-muted-foreground">管理试卷的树形分类结构</p>
      </div>

      <PaperCategoryTable
        data={categories}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onAddChild={handleOpenAddDrawer}
        onEdit={handleOpenEditDrawer}
        onDelete={handleDelete}
        onRefresh={refetch}
      />

      <PaperCategoryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        parentId={drawerParentId}
        category={selectedCategory}
        onSubmit={handleSubmit}
        categories={categories}
      />
    </div>
  )
}
