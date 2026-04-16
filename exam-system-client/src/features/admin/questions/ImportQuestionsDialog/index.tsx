import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { api } from '#/ApiInstance.ts'
import type { QuestionImportView, QuestionImportInput } from '#/__generated/model/static'
import { toast } from 'sonner'

import StepIndicator from './StepIndicator'
import Step1Upload from './Step1Upload'
import Step2Preview from './Step2Preview'
import Step3Success from './Step3Success'

interface ImportQuestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: () => void
}

type Step = 1 | 2 | 3

export default function ImportQuestionsDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportQuestionsDialogProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<QuestionImportView[]>([])
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  // 预览 Excel
  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      return api.questionController.previewExcel({ body: { file } })
    },
    onSuccess: (response) => {
      if (response.code === 200 && response.data) {
        setPreviewData([...response.data])
        setStep(2)
      } else {
        toast.error(response.msg || '预览失败')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '预览失败')
    },
    onSettled: () => {
      setIsPreviewLoading(false)
    },
  })

  // 导入题目
  const importMutation = useMutation({
    mutationFn: async (data: QuestionImportView[]) => {
      const importInputs: QuestionImportInput[] = data.map((item) => ({
        title: item.title,
        type: item.type,
        multi: item.multi,
        categoryId: item.categoryId,
        difficulty: item.difficulty,
        score: item.score,
        analysis: item.analysis,
        choices: item.choices as QuestionImportInput['choices'],
        answer: item.answer ?? null,
        keywords: item.keywords,
      }))

      return api.questionController.importQuestions({ body: importInputs })
    },
    onSuccess: (response) => {
      if (response.code === 200) {
        setStep(3)
        queryClient.invalidateQueries({ queryKey: ['questions'] })
        onImportSuccess?.()
      } else {
        toast.error(response.msg || '导入失败')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '导入失败')
    },
  })

  const handlePreview = useCallback(() => {
    if (!selectedFile) {
      toast.error('请选择文件')
      return
    }
    setIsPreviewLoading(true)
    previewMutation.mutate(selectedFile)
  }, [selectedFile, previewMutation])

  const handleImport = useCallback(() => {
    if (previewData.length === 0) {
      toast.error('没有可导入的数据')
      return
    }
    importMutation.mutate(previewData)
  }, [previewData, importMutation])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep(1)
      setSelectedFile(null)
      setPreviewData([])
    }
    onOpenChange(isOpen)
  }

  const handleBack = () => {
    setStep(1)
    setPreviewData([])
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">批量导入题目</DialogTitle>
          <DialogDescription>
            {step === 1 && '步骤 1：选择 Excel 文件'}
            {step === 2 && '步骤 2：预览数据'}
            {step === 3 && '导入完成'}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <div className="flex-1 overflow-auto px-6 py-4">
          {step === 1 && (
            <Step1Upload selectedFile={selectedFile} onFileChange={setSelectedFile} />
          )}

          {step === 2 && <Step2Preview data={previewData} />}

          {step === 3 && <Step3Success count={previewData.length} />}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handlePreview} disabled={!selectedFile || isPreviewLoading}>
                {isPreviewLoading ? '预览中...' : '预览数据'}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={handleBack} disabled={importMutation.isPending}>
                上一步
              </Button>
              <Button
                onClick={handleImport}
                disabled={previewData.length === 0 || importMutation.isPending}
              >
                {importMutation.isPending ? '导入中...' : '确认导入'}
              </Button>
            </>
          )}

          {step === 3 && <Button onClick={() => handleOpenChange(false)}>关闭</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
