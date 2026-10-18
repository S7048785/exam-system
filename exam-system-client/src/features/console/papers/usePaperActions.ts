import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api } from '#/ApiInstance.ts'
import type {
  GradeAnswerReq,
  PaperExamSettingsInput,
  PaperQuestionAddReq,
  PaperSaveInput,
  QuestionSaveReq,
  StartExamReq,
} from '#/__generated/model/static'
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
 * 开考：`POST /exams/start`（这场还有没交卷的记录 → 后端直接返回那条，即「续考」）。
 *
 * 返回的考试记录 id 是雪花 id、**字符串**（19 位，超过 JS 的 `Number.MAX_SAFE_INTEGER`），
 * 一路按字符串带到答题页的 `?recordId=` 上。试卷 id 由调用方从 mutation 变量带进来，
 * 不依赖入口页的路由参数。
 */
export const useStartExamMutation = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (body: StartExamReq) => api.examController.startExam({ body }),
    onSuccess: async (res, body) => {
      await navigate({
        to: '/exam/taking/$paperId',
        params: { paperId: String(body.paperId) },
        search: { recordId: res.data },
      })
    },
    onError: (err) => {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : '开考失败，请稍后重试',
      )
    },
  })
}

/** 建卷 / 更新基本信息（`POST /paper/save`）。成功后刷新列表，编辑态连详情一起刷 */
export const useSavePaperMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: PaperSaveInput) =>
      api.paperController.savePaperV2({ body }),
    onSuccess: async (res, body) => {
      await queryClient.invalidateQueries({ queryKey: ['listPapers'] })
      await queryClient.invalidateQueries({
        queryKey: ['paperDetail', body.id ?? res.data],
      })
    },
    onError: (err) =>
      toast.error(
        err instanceof Error && err.message ? err.message : '试卷信息保存失败',
      ),
  })
}

/** 发布考试（`POST /paper/{id}/publish`）；「没配考试设置」由后端 422 拦下 */
export const usePublishPaperMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.paperController.publishPaper({ id }),
    onSuccess: async (_res, id) => {
      toast.success('试卷发布成功')
      await queryClient.invalidateQueries({ queryKey: ['listPapers'] })
      await queryClient.invalidateQueries({ queryKey: ['paperDetail', id] })
    },
    onError: (err) =>
      toast.error(
        err instanceof Error && err.message ? err.message : '试卷发布失败',
      ),
  })
}

/** 保存考试设置；`onSaved` 给调用方关弹窗 / 通知父组件 */
export const useSaveExamSettingsMutation = (
  paperId: number,
  onSaved?: () => void,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: PaperExamSettingsInput) =>
      api.paperController.updatePaperExamSettings({ id: paperId, body }),
    onSuccess: async () => {
      toast.success('考试设置已保存')
      onSaved?.()
      await queryClient.invalidateQueries({
        queryKey: ['paperDetail', paperId],
      })
      await queryClient.invalidateQueries({ queryKey: ['listPapers'] })
    },
    onError: (err) =>
      toast.error(
        err instanceof Error && err.message ? err.message : '考试设置保存失败',
      ),
  })
}

/** 在试卷里新建题目：先建题（题库），再挂到试卷上。题目分数用 body.score */
export const useCreatePaperQuestionMutation = (
  paperId: number,
  onCreated?: () => void,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: QuestionSaveReq) => {
      const res = await api.questionController.addQuestion({ body })
      const questionId = res.data?.id
      if (!questionId) throw new Error('创建题目失败')
      await api.paperController.addPaperQuestions({
        id: paperId,
        body: { questions: [{ questionId, score: body.score }] },
      })
    },
    onSuccess: async () => {
      toast.success('试题添加成功')
      onCreated?.()
      await queryClient.invalidateQueries({
        queryKey: ['paper-questions', paperId],
      })
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : '试题添加失败'),
  })
}

/** 从题库勾选后挂到试卷（`POST /paper/{id}/questions`） */
export const useAddPaperQuestionsMutation = (
  paperId: number,
  onAdded?: (count: number) => void,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: PaperQuestionAddReq) =>
      api.paperController.addPaperQuestions({ id: paperId, body }),
    onSuccess: async (_res, body) => {
      toast.success(`已添加 ${body.questions.length} 道题目`)
      onAdded?.(body.questions.length)
      await queryClient.invalidateQueries({
        queryKey: ['paper-questions', paperId],
      })
    },
    onError: () => toast.error('添加失败'),
  })
}

/** 从试卷里移除一道题 */
export const useRemovePaperQuestionMutation = (paperId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (questionId: number) =>
      api.paperController.removePaperQuestion({ id: paperId, questionId }),
    onSuccess: async () => {
      toast.success('题目已移除')
      await queryClient.invalidateQueries({
        queryKey: ['paper-questions', paperId],
      })
    },
    onError: (err) => toast.error(err.message),
  })
}

/** 改某道题在试卷里的分值（不加提示，改错了再改一次就行） */
export const useUpdatePaperQuestionScoreMutation = (paperId: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (v: { questionId: number; score: number }) =>
      api.paperController.updatePaperQuestionScore({ id: paperId, ...v }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['paper-questions', paperId],
      })
    },
  })
}

/** 提交评卷（批量判对错 + 给分）；`onGraded` 给调用方清掉本地编辑态 */
export const useGradeAnswersMutation = (
  recordId: string | undefined,
  onGraded?: () => void,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: GradeAnswerReq[]) =>
      api.examController.gradeAnswers({
        publicId: recordId!,
        body: items,
      }),
    onSuccess: async () => {
      toast.success('评卷已提交')
      onGraded?.()
      // 详情里各题的对错/得分，以及父弹窗列表的分数、状态两列都要跟着变
      await queryClient.invalidateQueries({
        queryKey: ['examRecordDetail', recordId],
      })
      await queryClient.invalidateQueries({ queryKey: ['paperExamRecords'] })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : '提交评卷失败'),
  })
}
