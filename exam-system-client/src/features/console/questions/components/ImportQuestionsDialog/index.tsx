import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { api } from '#/ApiInstance.ts'
import type { QuestionImportResult } from '#/__generated/model/static'
import { toast } from 'sonner'

import Step1Upload from './Step1Upload.tsx'
import Step2Result from './Step2Result.tsx'
import StepIndicator from './StepIndicator.tsx'

interface ImportQuestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: () => void
}

type Step = 1 | 2

/**
 * 批量导入。2026-09-20 重写。
 *
 * 旧流程是两次往返：`preview-excel`（传文件拿解析结果）→ 浏览器里把结果拼成 JSON
 * → `import-questions`（把 JSON 传回来）。绕一圈不说，预览那一步在服务端**就会建分类**，
 * 点了预览又取消会留下空分类。
 *
 * 现在一次上传直接导入：`POST /question/batch/excel-import-questions`，
 * 服务端完成「解析 → 分类解析 → 入库」并返回逐行报告，前端只负责展示。
 */
export default function ImportQuestionsDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportQuestionsDialogProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<QuestionImportResult | null>(null)

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      return api.questionController.importExcelQuestions({ body: { file } })
    },
    onSuccess: (response) => {
      if (response.code !== 200) {
        toast.error(response.msg || '导入失败')
        return
      }
      const report: QuestionImportResult = response.data
      setResult(report)
      setStep(2)

      const skipped = report.duplicated + report.failed
      if (report.imported > 0) {
        queryClient.invalidateQueries({ queryKey: ['questions'] })
        onImportSuccess?.()
      }

      if (report.imported === 0) {
        toast.error('没有导入任何题目，详见报告')
      } else if (skipped > 0) {
        toast.warning(`已导入 ${report.imported} 条，跳过 ${skipped} 条`)
      } else {
        toast.success(`成功导入 ${report.imported} 条题目`)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '导入失败')
    },
  })

  const handleStartImport = useCallback(() => {
    if (!selectedFile) {
      toast.error('请选择文件')
      return
    }
    importMutation.mutate(selectedFile)
  }, [selectedFile, importMutation])

  const resetState = useCallback(() => {
    setStep(1)
    setSelectedFile(null)
    setResult(null)
  }, [])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState()
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">批量导入题目</DialogTitle>
          <DialogDescription>
            {step === 1 && '选择 Excel 文件，上传后直接导入并给出逐行结果'}
            {step === 2 && '导入结果'}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <div className="flex-1 overflow-auto px-6 py-4">
          {step === 1 && (
            <Step1Upload
              selectedFile={selectedFile}
              onFileChange={setSelectedFile}
            />
          )}

          {step === 2 && result && <Step2Result result={result} />}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          {step === 1 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={importMutation.isPending}
              >
                取消
              </Button>
              <Button
                onClick={handleStartImport}
                disabled={!selectedFile || importMutation.isPending}
              >
                {importMutation.isPending ? '导入中...' : '开始导入'}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={resetState}>
                再导入一个文件
              </Button>
              <Button onClick={() => handleOpenChange(false)}>关闭</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
