import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type {
  PaperCategorySaveInput,
  PaperCategoryUpdateInput,
} from '#/__generated/model/static'
import { toast } from 'sonner'

/** 422 的业务文案在 `error.message` 里（见 `#/lib/api-error.ts`） */
const errMsg = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

/** 树变了只重取树本身；`refetch` 由页面的「刷新」按钮自己拿 */
const useRefreshTree = () => {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: ['paper-category-tree'] })
}

/** 新增分类；`onAdded` 给调用方关抽屉（只有成功才回调） */
export const useAddCategoryMutation = (onAdded?: () => void) => {
  const refresh = useRefreshTree()

  return useMutation({
    mutationFn: (input: PaperCategorySaveInput) =>
      api.paperCategoryController.addCategory({ body: input }),
    onSuccess: async () => {
      toast.success('分类添加成功')
      onAdded?.()
      await refresh()
    },
    onError: (error) => toast.error(errMsg(error, '分类添加失败')),
  })
}

/** 更新分类 */
export const useUpdateCategoryMutation = (onUpdated?: () => void) => {
  const refresh = useRefreshTree()

  return useMutation({
    mutationFn: (input: PaperCategoryUpdateInput) =>
      api.paperCategoryController.updateCategory({ body: input }),
    onSuccess: async () => {
      toast.success('分类更新成功')
      onUpdated?.()
      await refresh()
    },
    onError: (error) => toast.error(errMsg(error, '分类更新失败')),
  })
}

/** 删除分类 */
export const useDeleteCategoryMutation = () => {
  const refresh = useRefreshTree()

  return useMutation({
    mutationFn: (id: number) =>
      api.paperCategoryController.removeCategory({ id }),
    onSuccess: async () => {
      toast.success('分类删除成功')
      await refresh()
    },
    onError: (error) => toast.error(errMsg(error, '分类删除失败')),
  })
}
