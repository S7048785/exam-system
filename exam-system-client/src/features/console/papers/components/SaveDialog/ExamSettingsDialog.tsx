import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { toast } from 'sonner'
import { api } from '#/ApiInstance.ts'
import { paperQueries } from '#/features/console/papers/paperQueries.ts'
import PaperExamSettingsForm, {
  toApiInput,
  toFormValues,
  type PaperExamSettingsValues,
} from '#/features/console/papers/components/PaperExamSettingsForm.tsx'

interface Props {
  paperId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 保存成功后回调（发布流程据此继续发发布请求） */
  onSaved?: () => void
}

/**
 * 考试设置弹窗 —— **只含** `paper_exam_settings` 的 13 个字段。
 *
 * 与列表行那个 `PaperSettingsDialog` 的区别：这里不含名称/分类/描述/参与方式。
 * 按约定，那 4 项只在向导第 0 步「考试信息」里改。
 *
 * 回填不走 `useEffect`：详情没到之前不渲染表单，`PaperExamSettingsForm` 挂载时
 * 一次性把 `defaultValues` 吃进 `useState`，所以详情缓存刷新不会冲掉用户正在改的内容。
 */
export default function ExamSettingsDialog({
  paperId,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const queryClient = useQueryClient()
  const { data: detailData, isPending } = useQuery(
    paperQueries.detail(paperId, open),
  )

  const save = useMutation({
    mutationFn: (values: PaperExamSettingsValues) =>
      api.paperController.updatePaperExamSettings({
        id: paperId,
        body: toApiInput(values),
      }),
  })

  const handleSubmit = async (values: PaperExamSettingsValues) => {
    try {
      await save.mutateAsync(values)
      await queryClient.invalidateQueries({
        queryKey: ['paperDetail', paperId],
      })
      await queryClient.invalidateQueries({ queryKey: ['listPapers'] })
      toast.success('考试设置已保存')
      onOpenChange(false)
      onSaved?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '考试设置保存失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[92%] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>考试设置</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          配置考试时长、起止时间、次数上限、及格分与各项开关
        </DialogDescription>

        <div className="flex-1 overflow-hidden">
          {isPending ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              加载中…
            </p>
          ) : (
            <PaperExamSettingsForm
              key={paperId}
              defaultValues={toFormValues(detailData?.data.examSettings)}
              submitting={save.isPending}
              onCancel={() => onOpenChange(false)}
              onSubmit={(v) => void handleSubmit(v)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
