import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type {
  CategoriesTree,
  CategorySaveInput,
  CategoryUpdateInput,
} from '#/__generated/model/static'
import CategoryTable from './CategoryTable'
import CategoryDrawer from './CategoryDrawer'
import { useState } from 'react'
import { categoryTreeOptions } from '#/features/admin/categories/categoryQueries.ts'

export default function CategoriesPage() {
  // 展开的分类 ID 集合
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // 选中的分类（用于编辑）
  const [selectedCategory, setSelectedCategory] =
    useState<CategoriesTree | null>(null)

  // Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add')
  const [drawerParentId, setDrawerParentId] = useState<number>(0)

  // 获取树形数据
  // const { data: treeData, refetch } = useQuery({
  //   queryKey: ['categoryTree'],
  //   queryFn: () => api.categoryController.tree(),
  // })
  const { data: treeData, refetch } = useSuspenseQuery(categoryTreeOptions)

  // 新增分类
  const addMutation = useMutation({
    mutationFn: (input: CategorySaveInput) =>
      api.categoryController.addCategory({ body: input }),
    onSuccess: () => {
      refetch()
    },
  })

  // 更新分类
  const updateMutation = useMutation({
    mutationFn: ({ input }: { input: CategoryUpdateInput }) =>
      api.categoryController.updateCategory({ body: input }),
    onSuccess: () => {
      refetch()
    },
  })

  // 删除分类
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.categoryController.removeCategory({ id }),
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

  // 打开新增 Drawer（指定父分类）
  const handleOpenAddDrawer = (parentId: number) => {
    setDrawerMode('add')
    setDrawerParentId(parentId)
    setDrawerOpen(true)
  }

  // 打开编辑 Drawer
  const handleOpenEditDrawer = (category: CategoriesTree) => {
    setSelectedCategory(category)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  // 提交表单
  const handleSubmit = (values: { name: string; sort: number }) => {
    if (drawerMode === 'add') {
      addMutation.mutate({
        name: values.name,
        parentId: drawerParentId,
        sort: values.sort,
      })
    } else if (selectedCategory) {
      updateMutation.mutate({
        input: {
          id: selectedCategory.id,
          name: values.name,
          parentId: selectedCategory.parentId,
          sort: values.sort,
        },
      })
    }
    setDrawerOpen(false)
  }

  // 删除分类
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const categories = treeData.data ?? []

  return (
    <div className="space-y-4">
      {/* 分类表格（树形展开） */}
      <CategoryTable
        data={categories}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onAddChild={handleOpenAddDrawer}
        onEdit={handleOpenEditDrawer}
        onDelete={handleDelete}
        onRefresh={refetch}
      />

      {/* 新增/编辑 Drawer */}
      <CategoryDrawer
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
