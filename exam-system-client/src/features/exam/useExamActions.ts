import { useMutation } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type { SubmitAnswerReq } from '#/__generated/model/static'
import type { ExamRecordId } from './examQueries.ts'

/** 副作用（toast / 跳转 / 翻「已保存」）一律由调用方给，这里只转发 */
type ActionCallbacks = {
  onSuccess?: () => void | Promise<void>
  onError?: (error: unknown) => void
}

/** 考试中手动保存答案。全量覆盖：`body` 必须是整份答卷 */
export const useSaveAnswersMutation = (
  recordId: ExamRecordId,
  callbacks?: ActionCallbacks,
) =>
  useMutation({
    mutationFn: (body: SubmitAnswerReq[]) =>
      api.examController.saveAnswers({ publicId: recordId, body }),
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  })

/** 交卷。后端按**已保存的答案**批改 ⇒ 必须先调 `useSaveAnswersMutation` */
export const useSubmitExamMutation = (
  recordId: ExamRecordId,
  callbacks?: ActionCallbacks,
) =>
  useMutation({
    mutationFn: (body: SubmitAnswerReq[]) =>
      api.examController.submitAnswers({ publicId: recordId, body }),
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  })
