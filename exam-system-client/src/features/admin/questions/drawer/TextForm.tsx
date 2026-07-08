import { useEffect } from 'react'
import type { QuestionsPageView } from '#/__generated/model/static'
import { Label } from '#/components/ui/label.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'

interface TextFormProps {
  value: string
  onChange: (value: string) => void
  editData?: QuestionsPageView | null
}

export default function TextForm({ value, onChange, editData }: TextFormProps) {
  // 初始化/回填数据
  useEffect(() => {
    if (editData) {
      onChange(editData.answers.answer || '')
    }
  }, [editData])

  return (
    <div className="space-y-2">
      <Label htmlFor="textAnswer">参考答案</Label>
      <Textarea
        id="textAnswer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="请输入参考答案"
        rows={3}
      />
    </div>
  )
}
