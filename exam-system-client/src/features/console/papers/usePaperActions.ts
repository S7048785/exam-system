import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import { toast } from 'sonner'

export const useDeleteMutation = () => {
  return useMutation({
    mutationFn: (id: number) => api.paperController.removePaper({ id }),
    onSuccess: (data) => {
      if (data.code === 200) {
        toast.success('删除成功')
      } else {
        toast.error(data.msg || '操作失败')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || '网络错误')
    },
  })
}

/**
 * 撤回发布：回到草稿态，并**物理删除**该卷的全部考试记录（不可恢复）。
 *
 * ⚠️ 成功后会失效试卷列表 —— 撤回把考试记录删光了，列表里的统计也需要刷新。
 */
export const useUnpublishMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.paperController.unpublishPaper({ id }),
    onSuccess: (data) => {
      if (data.code === 200) {
        toast.success('已撤回为草稿')
        queryClient.invalidateQueries({ queryKey: ['listPapers'] })
      } else {
        toast.error(data.msg || '撤回失败')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || '撤回失败')
    },
  })
}
