import { AlertTriangle, CheckCircle } from 'lucide-react'

import type { QuestionImportResult } from '#/__generated/model/static'

interface Step2ResultProps {
  result: QuestionImportResult
}

/**
 * 导入结果。取代了原来的「Step2 预览 + Step3 成功」两步：
 * 现在是一次上传直接入库，结果里既有成功数，也有逐行的失败原因和跳过的重复题。
 */
export default function Step2Result({ result }: Step2ResultProps) {
  const errors = result.errors
  const duplicatedTitles = result.duplicatedTitles
  const skipped = result.duplicated + result.failed
  const success = result.imported > 0

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        {success ? (
          <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-yellow-600" />
        )}
        <div className="space-y-1">
          <p className="font-medium">
            {success ? `成功导入 ${result.imported} 道题目` : '没有题目被导入'}
          </p>
          <p className="text-muted-foreground text-sm">
            共解析 {result.parsed} 条
            {skipped > 0 && ` · 跳过 ${skipped} 条`}
            {result.categoriesCreated > 0 &&
              ` · 自动新建分类 ${result.categoriesCreated} 个`}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border p-4">
          <p className="mb-2 text-sm font-medium">
            以下 {result.failed} 行填写有误，没有被导入
          </p>
          <ul className="text-muted-foreground max-h-64 space-y-1 overflow-auto text-sm">
            {errors.map((message, index) => (
              <li key={`${index}-${message}`}>{message}</li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">
            按提示改好后重新上传即可，已经导入的部分不会重复。
          </p>
        </div>
      )}

      {duplicatedTitles.length > 0 && (
        <div className="rounded-lg border p-4">
          <p className="mb-2 text-sm font-medium">
            以下题目题库里已存在，已跳过
          </p>
          <ul className="text-muted-foreground max-h-40 space-y-1 overflow-auto text-sm">
            {duplicatedTitles.map((title, index) => (
              <li key={`${index}-${title}`}>{title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
