import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type { QuestionSaveReq } from '#/__generated/model/static'
import type { QuestionUpdateReq } from '#/types/question-form.ts'
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
    (input: QuestionSaveReq) =>
      api.questionController.addQuestion({ body: input }),
    '题目添加成功',
    onSuccess,
  )

export const useUpdateQuestion = (onSuccess?: () => void) =>
  useBaseQuestionMutation(
    // ⚠️ id 是**路径参数**（`PUT /question/update/{id}`），body 才是 QuestionSaveReq。
    // 原来写成 `updateQuestion({ body: input as never })`：id 被留在 body 里没传出去，
    // URI 会拼成 `/question/update/undefined`，更新题目直接失败。这里把它拆出来。
    ({ id, ...body }: QuestionUpdateReq) =>
      api.questionController.updateQuestion({ id, body }),
    '题目更新成功',
    onSuccess,
  )

export const useDeleteQuestion = () =>
  useBaseQuestionMutation(
    (id: number) => api.questionController.removeQuestion({ id }),
    '删除成功',
  )
