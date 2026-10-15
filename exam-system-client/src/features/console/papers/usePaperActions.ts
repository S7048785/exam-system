import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api } from '#/ApiInstance.ts'
import type { StartExamReq } from '#/__generated/model/static'
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
        to: '/exam/paper/$paperId',
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
