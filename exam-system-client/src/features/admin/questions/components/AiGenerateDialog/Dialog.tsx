import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { api } from '#/ApiInstance.ts'
import type {
  QuestionGenerateDto,
  QuestionGenerateReq,
  QuestionImportInput,
} from '#/__generated/model/static'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { toast } from 'sonner'

import Step1Params from './Step1Params'
import Step2Generating from './Step2Generating'
import Step3Preview from './Step3Preview'
import Step4Success from './Step4Success'
import StepIndicator from './StepIndicator'
import type { Step } from './constants.ts'
import { categoryTreeQueryOptions } from '#/features/admin/questions/questionQueries.ts'

interface AiGenerateDialogProps {
  open: boolean
  onOpenChange: () => void
  onSuccess?: () => void
}

export default function AiGenerateDialog({
  open,
  onOpenChange,
  onSuccess,
}: AiGenerateDialogProps) {
  const queryClient = useQueryClient()

  // 步骤
  const [step, setStep] = useState<Step>(1)

  // 导入时需要的categoryId（从表单获取）
  const [categoryIdForImport, setCategoryIdForImport] = useState<number | null>(
    null,
  )

  // 生成结果
  const [generatedQuestions, setGeneratedQuestions] = useState<
    QuestionGenerateDto[]
  >([])

  // 获取分类树
  const { data: categoryData } = useSuspenseQuery(categoryTreeQueryOptions)
  const categories = categoryData.data

  // AI生成题目
  const generateMutation = useMutation({
    mutationFn: async (req: QuestionGenerateReq) => {
      return api.questionController.aiGenerate({ body: req })
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        setGeneratedQuestions([...response.data])
        setStep(3)
      } else {
        toast.error(response.msg || '生成失败')
        setStep(1)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '生成失败')
      setStep(1)
    },
  })

  // 导入题目
  const importMutation = useMutation({
    mutationFn: async (data: QuestionGenerateDto[]) => {
      const importInputs: QuestionImportInput[] = data.map((item) => ({
        title: item.title,
        type: item.type,
        categoryId: categoryIdForImport!,
        difficulty: item.difficulty,
        score: item.score,
        analysis: item.analysis,
        choices:
          item.type === 'SINGLE_CHOICE' || item.type === 'MULTIPLE_CHOICE'
            ? item.choices.map((choice, index) => ({
                content: choice,
                correct: item.answer.includes(
                  String.fromCharCode('A'.charCodeAt(0) + index),
                ),
                sort: index,
              }))
            : [],
        answer: item.answer,
      }))

      return api.questionController.importQuestions({ body: importInputs })
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        setStep(4)
        queryClient.invalidateQueries({ queryKey: ['questions'] })
        onSuccess?.()
      } else {
        toast.error(response.msg || '导入失败')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '导入失败')
    },
  })

  // 开始生成
  const handleStartGenerate = useCallback(
    (values: {
      count: number
      type: string
      difficulty: string
      categoryId: number | null
      includeMultiple: boolean
    }) => {
      if (!values.categoryId) {
        toast.error('请选择分类')
        return
      }

      setCategoryIdForImport(values.categoryId)
      setStep(2)
      generateMutation.mutate({
        count: values.count,
        types: values.type,
        difficulty: values.difficulty,
        categoryId: values.categoryId,
        includeMultiple: values.includeMultiple,
      })
    },
    [generateMutation],
  )

  // 确认导入
  const handleImport = useCallback(() => {
    if (generatedQuestions.length === 0) {
      toast.error('没有可导入的数据')
      return
    }
    importMutation.mutate(generatedQuestions)
  }, [generatedQuestions, importMutation])

  // 重置所有状态
  const resetState = () => {
    setStep(1)
    setCategoryIdForImport(null)
    setGeneratedQuestions([])
  }

  const handleBack = () => {
    setStep(1)
    setGeneratedQuestions([])
  }

  const stepDescriptions: Record<Step, string> = {
    1: '步骤 1：设置生成参数',
    2: '步骤 2：AI 正在生成题目',
    3: '步骤 3：预览生成的题目',
    4: '生成完成',
  }

  // 关键：动画完全结束后再重置状态
  const handleContentAnimationEnd = (
    e: React.AnimationEvent | React.TransitionEvent,
  ) => {
    // 只处理关闭时的动画结束（data-state=closed）
    const content = e.currentTarget as HTMLElement
    if (content.getAttribute('data-state') === 'closed') {
      resetState()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] max-w-2xl flex-col"
        onAnimationEnd={handleContentAnimationEnd} // ← 关键
        onTransitionEnd={handleContentAnimationEnd}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">AI 批量生成题目</DialogTitle>
          <DialogDescription>{stepDescriptions[step]}</DialogDescription>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <div className="flex-1 overflow-auto px-6 py-4">
          {step === 1 && (
            <Step1Params
              categories={categories}
              isGenerating={generateMutation.isPending}
              onCancel={onOpenChange}
              onStartGenerate={handleStartGenerate}
            />
          )}

          {step === 2 && <Step2Generating />}

          {step === 3 && (
            <Step3Preview
              data={generatedQuestions}
              isImporting={importMutation.isPending}
              onBack={handleBack}
              onImport={handleImport}
            />
          )}

          {step === 4 && (
            <Step4Success
              count={generatedQuestions.length}
              onClose={onOpenChange}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
