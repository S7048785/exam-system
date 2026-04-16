import { useEffect } from 'react'
import type { QuestionsPageView } from '#/__generated/model/static'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'

interface ChoiceFormProps {
  value: {
    multi: boolean
    analysis: string
    choices: Array<{ content: string; correct: boolean }>
  }
  onChange: (value: ChoiceFormProps['value']) => void
  editData?: QuestionsPageView | null
}

// 选项行组件
function ChoiceItem({
  index,
  choice,
  onChange,
  onDelete,
  canDelete,
}: {
  index: number
  choice: { content: string; correct: boolean }
  onChange: (choice: { content: string; correct: boolean }) => void
  onDelete: () => void
  canDelete: boolean
}) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-sm font-medium text-muted-foreground">
        {letters[index]}.
      </span>
      <Input
        value={choice.content}
        onChange={(e) => onChange({ ...choice, content: e.target.value })}
        placeholder={`选项 ${letters[index]}`}
        className="flex-1"
      />
      <div className="flex items-center gap-1.5">
        <Checkbox
          id={`correct-${index}`}
          checked={choice.correct}
          onCheckedChange={(checked) =>
            onChange({ ...choice, correct: !!checked })
          }
        />
        <Label
          htmlFor={`correct-${index}`}
          className="text-xs cursor-pointer select-none"
        >
          正确答案
        </Label>
      </div>
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default function ChoiceForm({
  value,
  onChange,
  editData,
}: ChoiceFormProps) {

  // 初始化/回填数据
  useEffect(() => {
    if (editData) {
      const choices: Array<{ content: string; correct: boolean }> = editData.choices.map((c) => ({
        content: c.content,
        correct: c.correct || false,
      }))
      // 补齐至少2个选项
      while (choices.length < 2) {
        choices.push({ content: '', correct: false })
      }
      // 解析正确答案
      const answerStr = editData.answers?.answer || ''
      const correctLetters = answerStr.split(',')
      choices.forEach((c, i) => {
        c.correct = correctLetters.includes(String.fromCharCode(65 + i))
      })
      onChange({
        multi: editData.multi || false,
        analysis: editData.analysis || '',
        choices,
      })
    }
  }, [editData])

  const handleMultiChange = (checked: boolean) => {
    const newValue = { ...value, multi: checked }
    // 切换为单选题时，只保留第一个正确答案
    if (!checked) {
      newValue.choices = value.choices.map((c, i) => {
        if (i === 0 && c.correct) return c
        return { ...c, correct: false }
      })
    }
    onChange(newValue)
  }

  const handleChoiceChange = (index: number, choice: { content: string; correct: boolean }) => {
    const newChoices = [...value.choices]
    newChoices[index] = choice
    // 单选题只保留一个正确答案
    if (!value.multi && choice.correct) {
      newChoices.forEach((c, i) => {
        if (i !== index) c.correct = false
      })
    }
    onChange({ ...value, choices: newChoices })
  }

  const addChoice = () => {
    if (value.choices.length < 8) {
      onChange({ ...value, choices: [...value.choices, { content: '', correct: false }] })
    }
  }

  const removeChoice = (index: number) => {
    if (value.choices.length > 2) {
      onChange({
        ...value,
        choices: value.choices.filter((_, i) => i !== index),
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* 是否多选题 */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="multi"
          checked={value.multi}
          onCheckedChange={handleMultiChange}
        />
        <Label htmlFor="multi" className="cursor-pointer select-none">
          多选题
        </Label>
      </div>

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

      {/* 选项 */}
      <div className="space-y-2">
        <Label>选项</Label>
        <div className="space-y-2">
          {value.choices.map((choice, index) => (
            <ChoiceItem
              key={index}
              index={index}
              choice={choice}
              onChange={(c) => handleChoiceChange(index, c)}
              onDelete={() => removeChoice(index)}
              canDelete={value.choices.length > 2}
            />
          ))}
        </div>
        {value.choices.length < 4 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChoice}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            添加选项
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          {value.multi
            ? '多选题：可勾选多个正确答案'
            : '单选题：只可勾选一个正确答案'}
        </p>
      </div>
    </div>
  )
}
