import { useEffect } from 'react'
import type { QuestionsPageView } from '#/__generated/model/static'
import { Checkbox } from '#/components/ui/checkbox'
import { Label } from '#/components/ui'
import { Textarea } from '#/components/ui/textarea'

interface JudgeFormProps {
  value: {
    analysis: string
    judgeAnswer: string
  }
  onChange: (value: JudgeFormProps['value']) => void
  editData?: QuestionsPageView | null
}

export default function JudgeForm({
  value,
  onChange,
  editData,
}: JudgeFormProps) {
  // 初始化/回填数据
  useEffect(() => {
    if (editData) {
      onChange({
        analysis: editData.analysis || '',
        judgeAnswer: editData.answers?.answer || 'true',
      })
    }
  }, [editData])

  return (
    <div className="space-y-4">
      {/* 题目解析 */}
      <div className="space-y-2">
        <Label htmlFor="analysis">题目解析</Label>
        <Textarea
          id="analysis"
          value={value.analysis}
          onChange={(e) => onChange({ ...value, analysis: e.target.value })}
          placeholder="请输入题目解析（可选）"
          rows={2}
        />
      </div>

      {/* 正确答案 */}
      <div className="space-y-2">
        <Label>正确答案</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="judge-true"
              checked={value.judgeAnswer === 'true'}
              onCheckedChange={() =>
                onChange({ ...value, judgeAnswer: 'true' })
              }
            />
            <Label htmlFor="judge-true" className="cursor-pointer select-none">
              正确
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="judge-false"
              checked={value.judgeAnswer === 'false'}
              onCheckedChange={() =>
                onChange({ ...value, judgeAnswer: 'false' })
              }
            />
            <Label htmlFor="judge-false" className="cursor-pointer select-none">
              错误
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}
