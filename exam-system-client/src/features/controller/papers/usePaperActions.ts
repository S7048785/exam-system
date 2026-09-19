import { useMutation } from '@tanstack/react-query'
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
