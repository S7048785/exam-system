import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type { UserSaveInput, UserUpdateInput } from '#/__generated/model/static'
import { toast } from 'sonner'

const useBaseUserMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<any>,
  successMsg: string,
  onSuccess?: () => void,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (data.code === 200) {
        toast.success(successMsg)
        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        onSuccess?.()
      } else {
        toast.error(data.msg || '操作失败')
      }
    },
    onError: () => {
      toast.error('网络错误')
    },
  })
}

export const useAddUser = (onSuccess?: () => void) =>
  useBaseUserMutation(
    (input: UserSaveInput) => api.userController.addUser({ body: input }),
    '用户添加成功',
    onSuccess,
  )

export const useUpdateUser = (onSuccess?: () => void) =>
  useBaseUserMutation(
    (input: UserUpdateInput) => api.userController.updateUser({ body: input }),
    '用户更新成功',
    onSuccess,
  )

export const useDeleteUser = () =>
  useBaseUserMutation(
    (id: number) => api.userController.removeUser({ id }),
    '删除成功',
  )
