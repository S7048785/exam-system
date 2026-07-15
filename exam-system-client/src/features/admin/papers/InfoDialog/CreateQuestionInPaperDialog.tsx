import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { toast } from 'sonner'
import { api } from '#/ApiInstance.ts'
import type { QuestionSaveInput } from '#/__generated/model/static'

const QUESTION_TYPES = [
  { value: 'CHOICE', label: '选择题' },
  { value: 'JUDGE', label: '判断题' },
  { value: 'TEXT', label: '简答题' },
]

interface ChoiceOption {
  content: string
  correct: boolean
}

interface CreateQuestionInPaperDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paperId: number
  onSuccess: () => void
}

export default function CreateQuestionInPaperDialog({
  open,
  onOpenChange,
  paperId,
  onSuccess,
}: CreateQuestionInPaperDialogProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('CHOICE')
  const [difficulty, setDifficulty] = useState('EASY')
  const [score, setScore] = useState(5)
  const [choices, setChoices] = useState<ChoiceOption[]>([
    { content: '', correct: false },
    { content: '', correct: false },
  ])
  const [judgeAnswer, setJudgeAnswer] = useState('true')
  const [textAnswer, setTextAnswer] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: QuestionSaveInput = {
        title,
        type,
        categoryId: 0,
        difficulty,
        score,
        choices:
          type === 'CHOICE'
            ? choices.map((c, i) => ({
                content: c.content,
                correct: c.correct || undefined,
                sort: i + 1,
              }))
            : undefined,
        answers:
          type === 'JUDGE'
            ? { answer: judgeAnswer }
            : type === 'TEXT'
              ? { answer: textAnswer }
              : { answer: choices.find((c) => c.correct)?.content ?? '' },
      } as any
      const res = await (api as any).questionController.addQuestion({
        body,
      })
      const questionId = res.data?.id
      if (!questionId) throw new Error('创建题目失败')

      await (api as any).paperController.addPaperQuestions({
        id: paperId,
        body: { questions: [{ questionId, score }] },
      })
    },
    onSuccess: () => {
      toast.success('试题添加成功')
      onSuccess()
      onOpenChange(false)
      resetForm()
    },
    onError: () => toast.error('试题添加失败'),
  })

  const resetForm = () => {
    setTitle('')
    setType('CHOICE')
    setDifficulty('EASY')
    setScore(5)
    setChoices([
      { content: '', correct: false },
      { content: '', correct: false },
    ])
    setJudgeAnswer('true')
    setTextAnswer('')
  }

  const addChoice = () => {
    setChoices([...choices, { content: '', correct: false }])
  }

  const removeChoice = (index: number) => {
    if (choices.length <= 2) return
    setChoices(choices.filter((_, i) => i !== index))
  }

  const updateChoice = (
    index: number,
    field: keyof ChoiceOption,
    value: string | boolean,
  ) => {
    setChoices(
      choices.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    )
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('请输入题目内容')
      return
    }
    if (type === 'CHOICE') {
      const valid = choices.every((c) => c.content.trim())
      if (!valid) {
        toast.error('请填写所有选项内容')
        return
      }
      const hasCorrect = choices.some((c) => c.correct)
      if (!hasCorrect) {
        toast.error('请至少设置一个正确答案')
        return
      }
    }
    if (type === 'TEXT' && !textAnswer.trim()) {
      toast.error('请输入标准答案')
      return
    }
    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px]">
        <DialogHeader>
          <DialogTitle>新增试题</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              题目类型 <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              题目内容 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入题目内容"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>
              难度 <span className="text-destructive">*</span>
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">简单</SelectItem>
                <SelectItem value="MEDIUM">普通</SelectItem>
                <SelectItem value="HARD">困难</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'CHOICE' && (
            <div className="space-y-2">
              <Label>
                选项 <span className="text-destructive">*</span>
              </Label>
              {choices.map((choice, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`选项 ${i + 1}`}
                    value={choice.content}
                    onChange={(e) => updateChoice(i, 'content', e.target.value)}
                  />
                  <label className="flex cursor-pointer items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={choice.correct}
                      onChange={(e) =>
                        updateChoice(i, 'correct', e.target.checked)
                      }
                    />
                    正确
                  </label>
                  {choices.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8 px-1"
                      onClick={() => removeChoice(i)}
                    >
                      删除
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={addChoice}
              >
                + 添加选项
              </Button>
            </div>
          )}

          {type === 'JUDGE' && (
            <div className="space-y-2">
              <Label>
                正确答案 <span className="text-destructive">*</span>
              </Label>
              <Select value={judgeAnswer} onValueChange={setJudgeAnswer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">对</SelectItem>
                  <SelectItem value="false">错</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'TEXT' && (
            <div className="space-y-2">
              <Label>
                标准答案 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="请输入标准答案"
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>
              分数 <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                resetForm()
              }}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? '添加中...' : '确认添加'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
