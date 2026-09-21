import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
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

const STEPS = [
  { title: '考试信息', description: '编辑试卷基本信息' },
  { title: '设计试卷', description: '选择试卷题目' },
  { title: '发布考试', description: '发布试卷并获取考试链接' },
]

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
        if (!name.trim()) {
          toast.error('请填写试卷名称')
          return
        }
        if (!categoryId) {
          toast.error('请选择试卷分类')
          return
        }
        if (duration <= 0) {
          toast.error('时长必须大于 0')
          return
        }
        if (!start || !end) {
          toast.error('请填写开考时间与截止时间')
          return
        }
        if (new Date(end) < new Date(start)) {
          toast.error('截止时间不能早于开考时间')
          return
        }
        if (maxAttempts < 1) {
          toast.error('考试次数上限不能小于 1')
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
        try {
          await updatePaperConfigMutation.mutateAsync(buildConfigInput())
          await queryClient.invalidateQueries({
            queryKey: ['paperDetail', editPaperId],
          })
          await queryClient.invalidateQueries({ queryKey: ['listPapers'] })
          toast.success('试卷信息已保存')
        } catch {
          toast.error('试卷信息保存失败')
          return
        }
      }

      if (index === 2 && targetPaperId) {
        const isPublished =
          dialogMode === 'edit' && detailData?.data.published === true
        // 还没发布：先确认有题目，再发布
        if (!isPublished) {
          try {
            const { data: questions } =
              await api.paperController.getPaperQuestions({
                id: targetPaperId,
              })
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
            queryClient.invalidateQueries({ queryKey: ['listPapers'] })
            toast.success('试卷发布成功')
          } catch {
            toast.error('发布失败')
            return
          }
        }
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
            <div>
              <XIcon onClick={() => setDialogOpen(false)} size={24} className={"hover:text-blue-400 cursor-pointer"} />
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
