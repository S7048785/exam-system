import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import type { CategoriesTree } from '#/__generated/model/static'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer'
import { Button } from '#/components/ui/button'
import { Input, Label } from '#/components/ui'
import { toast } from 'sonner'
import { useIsMobile } from '#/hooks/use-mobile.ts'

interface CategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  parentId: number
  category: CategoriesTree | null
  onSubmit: (values: { name: string; sort: number }) => void
  categories: readonly CategoriesTree[]
}

export default function CategoryDrawer({
  open,
  onOpenChange,
  mode,
  parentId,
  category,
  onSubmit,
  categories,
}: CategoryDrawerProps) {
  const isMobile = useIsMobile()

  const form = useForm({
    defaultValues: {
      name: '',
      sort: 0,
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) {
        toast.error('请输入分类名称')
        return
      }
      onSubmit({ name: value.name.trim(), sort: value.sort })
      form.reset()
    },
  })

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        form.reset({
          name: category.name,
          sort: category.sort,
        })
      } else {
        form.reset({
          name: '',
          sort: 0,
        })
      }
    }
  }, [open, mode, category, form])

  // 获取父分类名称
  const getParentName = () => {
    if (parentId === 0) return '顶级分类'
    const findParent = (
      cats: readonly CategoriesTree[],
      id: number,
    ): string | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat.name
        if (cat.children) {
          const found = findParent(cat.children, id)
          if (found) return found
        }
      }
      return null
    }
    return findParent(categories, parentId) ?? '未知'
  }

  return (
    <Drawer
      direction={isMobile ? 'bottom' : 'right'}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{mode === 'add' ? '新增分类' : '编辑分类'}</DrawerTitle>
          <DrawerDescription>
            {mode === 'add'
              ? `将为「${getParentName()}」添加子分类`
              : `编辑分类「${category?.name}」`}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* 分类名称 */}
            <form.Field
              name="name"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">分类名称</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="请输入分类名称"
                  />
                </div>
              )}
            />

            {/* 排序 */}
            <form.Field
              name="sort"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="sort">排序</Label>
                  <Input
                    id="sort"
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    placeholder="数值越小越靠前"
                  />
                </div>
              )}
            />

            {/* 只读：父分类（编辑模式下） */}
            {mode === 'edit' && (
              <div className="space-y-2">
                <Label>父分类</Label>
                <Input
                  value={
                    category?.parentId === 0
                      ? '顶级分类'
                      : (() => {
                          const findParent = (
                            cats: readonly CategoriesTree[],
                            id: number,
                          ): string | null => {
                            for (const cat of cats) {
                              if (cat.id === id) return cat.name
                              if (cat.children) {
                                const found = findParent(cat.children, id)
                                if (found) return found
                              }
                            }
                            return null
                          }
                          return (
                            findParent(categories, category?.parentId ?? 0) ??
                            '未知'
                          )
                        })()
                  }
                  disabled
                />
                <p className="text-muted-foreground text-xs">
                  编辑模式下不可修改父分类
                </p>
              </div>
            )}

            <DrawerFooter className="px-0 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={() => form.handleSubmit()}>
                {mode === 'add' ? '新增' : '保存'}
              </Button>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
