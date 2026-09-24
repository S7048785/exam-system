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
import type { PaperSaveInput } from '#/__generated/model/static'
import type { ParticipateMode } from '#/__generated/model/enums'
import StepIndicator from './StepIndicator.tsx'
import StepBasicInfo from './StepBasicInfo.tsx'
import StepDesignPaper from './StepDesignPaper/StepDesignPaper.tsx'
import StepPublishExam from './StepPublishExam.tsx'
import { usePaperListStore } from '#/stores/paper-list.ts'
import { useShallow } from 'zustand/react/shallow'
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
 * 只校验这一步的 4 个字段 —— 时长 / 起止时间 / 次数上限 / 及格分 / 开关属于「考试设置」，
 * 不在向导里填（新建时后端落默认值，之后到列表页该试卷的「设置」弹窗改）。
 */
const paperInfoSchema = z.object({
  name: z.string().trim().min(1, '请填写试卷名称'),
  categoryId: z.number('请选择试卷分类'),
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

  // 表单状态（只含试卷自身的 4 个字段）
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [description, setDescription] = useState('')
  const [participateMode, setParticipateMode] =
    useState<ParticipateMode>('LOGIN_REQUIRED')

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
        setDescription(d.description ?? '')
        setCategoryId(d.categoryId)
        setParticipateMode(d.participateMode)
      } else {
        setName('')
        setCategoryId(undefined)
        setDescription('')
        setParticipateMode('LOGIN_REQUIRED')
      }
    }
  }, [dialogOpen, dialogMode, detailData])

  // 保存试卷：同一接口兼顾新增/更新（带 id = 更新，不带 id = 新增）
  const savePaperMutation = useMutation({
    mutationFn: (input: PaperSaveInput) =>
      api.paperController.savePaperV2({ body: input }),
  })

  /** 向导第 0 步的表单 → PaperSaveInput（id 只在更新时给） */
  const buildSaveInput = (id?: number): PaperSaveInput => ({
    id,
    name,
    description,
    categoryId: categoryId!,
    participateMode,
  })

  const switchToStep = async (index: number) => {
    let targetPaperId = effectivePaperId

    if (index > currentStep) {
      if (currentStep === 0) {
        const checked = paperInfoSchema.safeParse({ name, categoryId })
        if (!checked.success) {
          toast.error(checked.error.issues[0].message)
          return
        }
      }

      // 离开第 0 步：保存基本信息。新建走新增（后端顺带落实考试设置行默认值），
      // 编辑（或再次回到第 0 步后重进）带 id 走更新。
      if (currentStep === 0 && index > 0) {
        const idToSave = dialogMode === 'edit' ? editPaperId : createdPaperId
        try {
          const res = await savePaperMutation.mutateAsync(buildSaveInput(idToSave))
          if (dialogMode === 'create') setCreatedPaperId(res.data)
          targetPaperId = res.data
          if (idToSave) {
            await queryClient.invalidateQueries({
              queryKey: ['paperDetail', idToSave],
            })
          }
          queryClient.invalidateQueries({ queryKey: ['listPapers'] })
        } catch (e) {
          toast.error(e instanceof Error ? e.message : '试卷信息保存失败')
          return
        }
      }
    }

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
              participateMode={participateMode}
              categoryTree={categoryTree}
              onNameChange={setName}
              onCategoryChange={setCategoryId}
              onDescriptionChange={setDescription}
              onParticipateModeChange={setParticipateMode}
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
