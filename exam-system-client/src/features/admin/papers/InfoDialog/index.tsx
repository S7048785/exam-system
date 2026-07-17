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
import { paperQueries } from '#/features/admin/papers/paperQueries.ts'
import { api } from '#/ApiInstance.ts'
import StepIndicator from './StepIndicator.tsx'
import StepBasicInfo from './StepBasicInfo.tsx'
import StepDesignPaper from './StepDesignPaper.tsx'
import StepPublishExam from './StepPublishExam.tsx'

const STEPS = [
  { title: '考试信息', description: '编辑试卷基本信息' },
  { title: '设计试卷', description: '选择试卷题目' },
  { title: '发布考试', description: '发布试卷并获取考试链接' },
]

interface PaperInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  paperId?: number
}

export default function PaperInfoDialog({
  open,
  onOpenChange,
  mode,
  paperId: propPaperId,
}: PaperInfoDialogProps) {
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [createdPaperId, setCreatedPaperId] = useState<number | undefined>()
  const effectivePaperId = propPaperId ?? createdPaperId

  // 表单状态
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)

  // 分类树
  const { data: treeData } = useQuery({
    queryKey: ['paper-category-tree'],
    queryFn: () => api.paperCategoryController.tree(),
    enabled: open,
  })
  const categoryTree = treeData?.data ?? []

  // 编辑模式：加载试卷详情
  const { data: detailData } = useQuery({
    ...paperQueries.detail(propPaperId!),
    enabled: open && mode === 'edit' && !!propPaperId,
  })

  useEffect(() => {
    if (open) {
      setCreatedPaperId(undefined)
      setCurrentStep(0)
      if (mode === 'edit' && detailData?.data) {
        const d = detailData.data
        setName(d.name)
        setDescription(d.description)
        setDuration(d.duration)
        setCategoryId(d.categoryId)
      } else {
        setName('')
        setCategoryId(undefined)
        setDescription('')
        setDuration(60)
      }
    }
  }, [open, mode, detailData])

  const addPaperV2Mutation = useMutation({
    mutationFn: (input: any) => api.paperController.addPaperV2({ body: input }),
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
      }

      if (mode === 'create' && !createdPaperId && index >= 1) {
        try {
          const res = await addPaperV2Mutation.mutateAsync({
            name,
            description,
            duration,
            categoryId: categoryId ?? undefined,
          })
          setCreatedPaperId(res.data)
          targetPaperId = res.data
        } catch {
          return
        }
      }

      if (index === 2 && targetPaperId) {
        const isPublished =
          mode === 'edit' && detailData?.data.published
        if (!isPublished) {
          return
        }
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

        if (!isPublished) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-179 w-[95%] max-w-none flex-col overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex flex-row items-center justify-between">
            <div className="text-base">
              {mode === 'edit' ? '编辑试卷' : '新增试卷'}
            </div>
            <StepIndicator
              steps={STEPS}
              currentStep={currentStep}
              onStepClick={switchToStep}
            />
            <div></div>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {STEPS[currentStep].description}
        </DialogDescription>
        <div className="flex-1 overflow-hidden bg-neutral-800 p-4">
          {currentStep === 0 ? (
            <StepBasicInfo
              name={name}
              categoryId={categoryId}
              description={description}
              duration={duration}
              categoryTree={categoryTree}
              onNameChange={setName}
              onCategoryChange={setCategoryId}
              onDescriptionChange={setDescription}
              onDurationChange={setDuration}
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
