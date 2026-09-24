import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { toast } from 'sonner'
import { paperQueries } from '#/features/console/papers/paperQueries.ts'
import { api } from '#/ApiInstance.ts'
import type { PaperConfigInput } from '#/__generated/model/static'
import type { ParticipateMode } from '#/__generated/model/enums'
import StepIndicator from './StepIndicator.tsx'
import StepBasicInfo from './StepBasicInfo.tsx'
import StepDesignPaper from './StepDesignPaper/StepDesignPaper.tsx'
import StepPublishExam from './StepPublishExam.tsx'
import { usePaperListStore } from '#/stores/paper-list.ts'
import { useShallow } from 'zustand/react/shallow'
import {
  defaultTimeWindow,
  toApiDateTime,
  toLocalInput,
} from '#/features/console/papers/time-window.ts'
import { XIcon } from 'lucide-react'
import z from 'zod'

const STEPS = [
  { title: '考试信息', description: '编辑试卷基本信息' },
  { title: '设计试卷', description: '选择试卷题目' },
  { title: '发布考试', description: '发布试卷并获取考试链接' },
]

/**
 * 「考试信息」这一步的校验。
 *
 * 文案与原来的手写 if 链逐字一致（原来的顺序：名称 → 分类 → 时长 → 起止时间 → 时间先后 → 次数上限）。
 */
const paperConfigSchema = z
  .object({
    name: z.string().trim().min(1, '请填写试卷名称'),
    categoryId: z.number('请选择试卷分类'),
    duration: z.number('时长必须大于 0').gt(0, '时长必须大于 0'),
    start: z.string().min(1, '请填写开考时间与截止时间'),
    end: z.string().min(1, '请填写开考时间与截止时间'),
    maxAttempts: z
      .number('考试次数上限不能小于 1')
      .min(1, '考试次数上限不能小于 1'),
  })
  // 起止时间缺失时交给上面的必填校验报错，这里只比先后
  .refine((v) => !v.start || !v.end || new Date(v.end) >= new Date(v.start), {
    message: '截止时间不能早于开考时间',
    path: ['end'],
  })

export default function PaperInfoDialog() {
  const queryClient = useQueryClient()

  const {
    dialogMode,
    setDialogOpen,
    dialogOpen,
    editPaperId,
    dialogInitialStep,
  } = usePaperListStore(
    useShallow((state) => ({
      dialogOpen: state.dialogOpen,
      dialogMode: state.dialogMode,
      setDialogOpen: state.setDialogOpen,
      editPaperId: state.editPaperId,
      dialogInitialStep: state.dialogInitialStep,
    })),
  )

  const [currentStep, setCurrentStep] = useState(0)
  const [createdPaperId, setCreatedPaperId] = useState<number | undefined>()
  // 发布请求进行中：步骤二的「发布试卷」按钮据此置灰，避免重复点击
  const [publishing, setPublishing] = useState(false)
  // 本次会话内已发布过（编辑态的发布来自详情里的 published 字段）
  const [publishedInSession, setPublishedInSession] = useState(false)
  const effectivePaperId = editPaperId ?? createdPaperId

  // 表单状态
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  // 考试设置（后端 PaperConfigInput 里 start/end/participateMode/maxAttempts 都是必填）
  const [start, setStart] = useState(() => defaultTimeWindow().start)
  const [end, setEnd] = useState(() => defaultTimeWindow().end)
  const [participateMode, setParticipateMode] =
    useState<ParticipateMode>('LOGIN_REQUIRED')
  const [maxAttempts, setMaxAttempts] = useState(1)

  // 分类树
  const { data: treeData } = useQuery({
    queryKey: ['paper-category-tree'],
    queryFn: () => api.paperCategoryController.tree(),
    enabled: dialogOpen,
  })
  const categoryTree = treeData?.data ?? []

  // 编辑模式：加载试卷详情
  const { data: detailData } = useQuery({
    ...paperQueries.detail(editPaperId!),
    enabled: dialogOpen && dialogMode === 'edit' && !!editPaperId,
  })

  /**
   * 试卷是否已发布 —— 已发布就不再请求发布接口，只跳转到步骤三。
   *
   * 两个来源：
   * - 编辑态的 `published` 字段（打开弹窗时详情是多少就是多少）；
   * - 本次会话内发布成功的标记（详情缓存可能还是旧的 `published: false`）。
   */
  const isPublished =
    publishedInSession ||
    (dialogMode === 'edit' && detailData?.data.published === true)

  // 每次打开弹窗重置发布标记（只依赖弹窗身份，别跟着 detailData 刷新一起清掉）
  useEffect(() => {
    if (dialogOpen) setPublishedInSession(false)
  }, [dialogOpen, dialogMode, editPaperId])

  useEffect(() => {
    if (dialogOpen) {
      setCreatedPaperId(undefined)
      setCurrentStep(dialogInitialStep)
      if (dialogMode === 'edit' && detailData?.data) {
        const d = detailData.data
        setName(d.name)
        setDescription(d.description)
        setDuration(d.duration)
        setCategoryId(d.categoryId)
        setStart(toLocalInput(d.start))
        setEnd(toLocalInput(d.end))
        setParticipateMode(d.participateMode)
        setMaxAttempts(d.maxAttempts)
      } else {
        const w = defaultTimeWindow()
        setName('')
        setCategoryId(undefined)
        setDescription('')
        setDuration(60)
        setStart(w.start)
        setEnd(w.end)
        setParticipateMode('LOGIN_REQUIRED')
        setMaxAttempts(1)
      }
    }
  }, [dialogOpen, dialogMode, detailData])

  const addPaperV2Mutation = useMutation({
    mutationFn: (input: PaperConfigInput) =>
      api.paperController.addPaperV2({ body: input }),
  })

  // 编辑模式：把「考试信息」这一步的改动提交回去
  // （2026-09-20 补：原来只有 create 分支会提交，编辑试卷时改了配置根本不会保存）
  const updatePaperConfigMutation = useMutation({
    mutationFn: (input: PaperConfigInput) =>
      api.paperController.updatePaperConfig({ id: editPaperId!, body: input }),
  })

  /** 第 0 步表单 → PaperConfigInput（8 个字段后端全必填，create / edit 共用同一份结构） */
  const buildConfigInput = (): PaperConfigInput => ({
    name,
    description,
    duration,
    categoryId: categoryId!,
    start: toApiDateTime(start),
    end: toApiDateTime(end),
    participateMode,
    maxAttempts,
  })

  const switchToStep = async (index: number) => {
    let targetPaperId = effectivePaperId

    if (index > currentStep) {
      if (currentStep === 0) {
        const checked = paperConfigSchema.safeParse({
          name,
          categoryId,
          duration,
          start,
          end,
          maxAttempts,
        })
        if (!checked.success) {
          toast.error(checked.error.issues[0].message)
          return
        }
      }

      if (dialogMode === 'create' && !createdPaperId && index >= 1) {
        try {
          const res = await addPaperV2Mutation.mutateAsync(buildConfigInput())
          setCreatedPaperId(res.data)
          targetPaperId = res.data
        } catch {
          return
        }
      }

      // 编辑模式：离开第 0 步时保存「考试信息」的改动
      // （后端 PUT /paper/{id}/config 是全字段更新，已发布的试卷也允许改）
      if (
        dialogMode === 'edit' &&
        editPaperId &&
        currentStep === 0 &&
        index > 0
      ) {
          updatePaperConfigMutation.mutateAsync(buildConfigInput())
          queryClient.invalidateQueries({
            queryKey: ['paperDetail', editPaperId],
          })
          queryClient.invalidateQueries({ queryKey: ['listPapers'] })

      }
    }

    // 进入「设计试卷」时试卷已经是草稿态（published = false），无需额外调用撤回接口。
    // 已发布则不再请求发布接口，只负责跳到步骤三看考试入口。
    if (index === 2 && targetPaperId && !isPublished) {
      setPublishing(true)
      try {
        // 校验：试题不能为空
        try {
          const { data: questions } =
            await api.paperController.getPaperQuestions({ id: targetPaperId })
          if (!questions.length) {
            toast.error('请先添加试题')
            return
          }
        } catch {
          toast.error('查询试题失败')
          return
        }

        try {
          await api.paperController.publishPaper({ id: targetPaperId })
          setPublishedInSession(true)
          queryClient.invalidateQueries({ queryKey: ['listPapers'] })
          toast.success('试卷发布成功')
        } catch {
          // 已发布的卷再调用会抛 422「试卷已发布」——按需求前端不处理该异常，照常跳转
        }
      } finally {
        setPublishing(false)
      }
    }
    setCurrentStep(index)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent
        showCloseButton={false}
        className="flex h-179 w-[95%] max-w-none flex-col overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex flex-row items-center justify-between">
            <div className="text-base">
              {dialogMode === 'edit' ? '编辑试卷' : '新增试卷'}
            </div>
            <StepIndicator
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={switchToStep}
            />
            <div className="flex items-center gap-3">
              {/* 「设计试卷」这一步才有发布入口，放在关闭按钮左侧 */}
              {currentStep === 1 && (
                <Button
                  size="sm"
                  onClick={() => void switchToStep(2)}
                  disabled={publishing}
                >
                  {publishing ? '发布中…' : '发布试卷'}
                </Button>
              )}
              <XIcon
                onClick={() => setDialogOpen(false)}
                size={24}
                className={'hover:text-blue-400 cursor-pointer'}
              />
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {STEPS[currentStep].description}
        </DialogDescription>
        <div className="bg-muted/90 flex-1 overflow-hidden p-4">
          {currentStep === 0 ? (
            <StepBasicInfo
              name={name}
              categoryId={categoryId}
              description={description}
              duration={duration}
              start={start}
              end={end}
              participateMode={participateMode}
              maxAttempts={maxAttempts}
              categoryTree={categoryTree}
              onNameChange={setName}
              onCategoryChange={setCategoryId}
              onDescriptionChange={setDescription}
              onDurationChange={setDuration}
              onStartChange={setStart}
              onEndChange={setEnd}
              onParticipateModeChange={setParticipateMode}
              onMaxAttemptsChange={setMaxAttempts}
            />
          ) : currentStep === 1 ? (
            <StepDesignPaper paperId={effectivePaperId!} />
          ) : (
            <StepPublishExam
              paperId={effectivePaperId!}
              description={description}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
