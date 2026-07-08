import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type {
  QuestionSaveInput,
  QuestionUpdateInput,
} from '#/__generated/model/static'
import { toast } from 'sonner'

const useBaseQuestionMutation = <TVariables>(
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
        queryClient.invalidateQueries({ queryKey: ['questions'] })
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

export const useAddQuestion = (onSuccess?: () => void) =>
  useBaseQuestionMutation(
    (input: QuestionSaveInput) =>
      api.questionController.addQuestion({ body: input }),
    '题目添加成功',
    onSuccess,
  )

export const useUpdateQuestion = (onSuccess?: () => void) =>
  useBaseQuestionMutation(
    (input: QuestionUpdateInput) =>
      api.questionController.updateQuestion({ body: input }),
    '题目更新成功',
    onSuccess,
  )

export const useDeleteQuestion = () =>
  useBaseQuestionMutation(
    (id: number) => api.questionController.removeQuestion({ id }),
    '删除成功',
  )
