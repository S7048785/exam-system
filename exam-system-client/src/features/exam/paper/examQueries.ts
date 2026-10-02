import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type {
  ExamTakingView,
  SubmitAnswerReq,
} from '#/__generated/model/static'

/**
 * 考试记录 id：雪花 id 有 19 位，超过 JS 的 `Number.MAX_SAFE_INTEGER`。
 *
 * 后端相关路径参数已经改成 `String`、生成的 TS 类型也是 `string`，所以前端**全程按字符串走**
 * 就行（`encodeURIComponent` 原样拼进 URL）—— 千万别中途 `Number()`，一转换就掉精度、
 * 后端查不到记录。
 */
export type ExamRecordId = string

/**
 * 答题页数据：`GET /exams/{recordId}/taking`（**不含正确答案**）。
 *
 * 返回里的 `answerRecords` 是这场考试**已经保存过的答案**，继续考试时用它把勾选状态恢复出来
 * （见 `answerRecordsToMap`）。
 */
export const examTakingQueryOptions = (recordId: ExamRecordId) =>
  queryOptions({
    queryKey: ['examTaking', recordId],
    queryFn: () => api.examController.getExamTaking({ id: recordId }),
    select: (res): ExamTakingView => res.data,
    retry: false,
  })

/**
 * 考试中手动保存答案。
 *
 * 🔴 **全量覆盖**：后端先删掉这场考试的全部答案，再按 `body` 整份重建（`ExamRecordService.saveAnswers`），
 * 所以 `body` 必须是**整份答卷**，绝不能只传改动的那几题 —— 否则其余答案会被清空。
 * 未作答的题不出现在 `body` 里，就等价于「这题没答」。
 */
export const saveExamAnswers = (
  recordId: ExamRecordId,
  body: SubmitAnswerReq[],
) => api.examController.saveAnswers({ examRecordId: recordId, body })

/**
 * 交卷。
 *
 * 🔴 后端**不会**在这里落库答案（`ExamRecordService.submitAnswers` 里明说了，`answers` 形参只为
 * 保持接口契约），它是按**已保存的答案**批改的 —— 所以必须先 `saveExamAnswers`。
 * 页面上靠「未保存 → 保存试卷 / 已保存 → 提交试卷」那个按钮保证这个顺序。
 */
export const submitExamAnswers = (
  recordId: ExamRecordId,
  body: SubmitAnswerReq[],
) => api.examController.submitAnswers({ examRecordId: recordId, body })
