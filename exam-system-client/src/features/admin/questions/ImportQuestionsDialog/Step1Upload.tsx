import { useCallback, useRef } from 'react'
import { Download, FileCheck, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'

interface Step1UploadProps {
  selectedFile: File | null
  onFileChange: (file: File | null) => void
}

export default function Step1Upload({
  selectedFile,
  onFileChange,
}: Step1UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const validTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ]
        if (
          !validTypes.includes(file.type) &&
          !file.name.endsWith('.xlsx') &&
          !file.name.endsWith('.xls')
        ) {
          toast.error('请上传 Excel 文件 (.xlsx, .xls)')
          return
        }
        onFileChange(file)
      }
    },
    [onFileChange],
  )

  const handleDownloadTemplate = async () => {
    try {
      const BASE_URL = import.meta.env.VITE_API_URL
      const response = await fetch(`http://${BASE_URL}/question/batch/template`)
      if (!response.ok) throw new Error('下载失败')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '题目导入模板.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('模板下载成功')
    } catch {
      toast.error('模板下载失败')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="sr-only"
        onChange={handleFileChange}
      />

      {selectedFile ? (
        <div className="flex flex-col items-center gap-4">
          <FileCheck className="h-12 w-12 text-green-600" />
          <div className="text-center">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-muted-foreground text-sm">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            重新选择
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Button
            variant="outline"
            className="flex h-32 w-64 flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 opacity-60" />
            <span className="text-muted-foreground text-sm">
              点击选择 Excel 文件
            </span>
          </Button>
          <p className="text-muted-foreground text-xs">支持 .xlsx, .xls 格式</p>
          <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
            <Download className="mr-1 h-4 w-4" />
            下载模板文件
          </Button>
        </div>
      )}
    </div>
  )
}
