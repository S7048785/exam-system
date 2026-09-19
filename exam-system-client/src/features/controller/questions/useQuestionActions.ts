import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type { QuestionUpdateInput } from '#/__generated/model/static'
import type {
  QuestionSaveReq,
  QuestionUpdatePayload,
} from '#/types/question-save.ts'
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
    // 生成的 QuestionUpdateInput 里 answers 标成必填、嵌套 choices 又没导出 id，
    // 与运行时契约（answers 可省、choices 每个必须带 id）不一致 —— 见 types/question-save.ts
    (input: QuestionUpdatePayload) =>
      api.questionController.updateQuestion({
        body: input as unknown as QuestionUpdateInput,
      }),
    '题目更新成功',
    onSuccess,
  )

export const useDeleteQuestion = () =>
  useBaseQuestionMutation(
    (id: number) => api.questionController.removeQuestion({ id }),
    '删除成功',
  )
