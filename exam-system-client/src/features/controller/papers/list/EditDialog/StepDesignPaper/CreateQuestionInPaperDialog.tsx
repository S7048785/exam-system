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
import type { QuestionSaveReq } from '#/types/question-save.ts'
import type { QuestionDifficulty } from '#/__generated/model/enums'
import { api } from '#/ApiInstance.ts'
import ChoiceForm from '#/features/controller/questions/components/drawer/ChoiceForm.tsx'
import JudgeForm from '#/features/controller/questions/components/drawer/JudgeForm.tsx'
import TextForm from '#/features/controller/questions/components/drawer/TextForm.tsx'

type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'JUDGE' | 'TEXT'

interface CreateQuestionInPaperDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paperId: number
  onSuccess: () => void
  questionType: QuestionType
}

const TYPE_TITLE: Record<QuestionType, string> = {
  SINGLE_CHOICE: '单选题',
  MULTIPLE_CHOICE: '多选题',
  JUDGE: '判断题',
  TEXT: '简答题',
}

export default function CreateQuestionInPaperDialog({
  open,
  onOpenChange,
  paperId,
  onSuccess,
  questionType,
}: CreateQuestionInPaperDialogProps) {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('EASY')
  const [score, setScore] = useState(5)

  const [choiceValue, setChoiceValue] = useState({
    analysis: '',
    choices: [
      { content: '', correct: false },
      { content: '', correct: false },
    ],
  })

  const [judgeValue, setJudgeValue] = useState({
    analysis: '',
    judgeAnswer: 'true',
  })

  const [textAnswer, setTextAnswer] = useState('')

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: QuestionSaveReq = {
        title,
        type: questionType,
        categoryId: 0,
        difficulty,
        score,
        analysis: '',
        extra: {},
      }

      if (
        questionType === 'SINGLE_CHOICE' ||
        questionType === 'MULTIPLE_CHOICE'
      ) {
        // ⚠️ 判别值 type 必须放在 extra 内部（QuestionExtra 的 @JsonTypeInfo(As.EXTERNAL_PROPERTY)）
        body.extra = {
          type: questionType,
          choices: choiceValue.choices.map((c, i) => ({
            content: c.content,
            correct: c.correct || undefined,
            sort: i + 1,
          })),
        }
        if (choiceValue.analysis) body.analysis = choiceValue.analysis
      } else if (questionType === 'JUDGE') {
        body.extra = { type: 'JUDGE', answer: judgeValue.judgeAnswer }
        if (judgeValue.analysis) body.analysis = judgeValue.analysis
      } else {
        body.extra = { type: 'TEXT', answer: textAnswer }
      }

      const res = await api.questionController.addQuestion({ body })
      const questionId = res.data?.id
      if (!questionId) throw new Error('创建题目失败')

      await api.paperController.addPaperQuestions({
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
    setDifficulty('EASY')
    setScore(5)
    setChoiceValue({
      analysis: '',
      choices: [
        { content: '', correct: false },
        { content: '', correct: false },
      ],
    })
    setJudgeValue({ analysis: '', judgeAnswer: 'true' })
    setTextAnswer('')
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('请输入题目内容')
      return
    }
    if (
      questionType === 'SINGLE_CHOICE' ||
      questionType === 'MULTIPLE_CHOICE'
    ) {
      const valid = choiceValue.choices.every((c) => c.content.trim())
      if (!valid) {
        toast.error('请填写所有选项内容')
        return
      }
      const hasCorrect = choiceValue.choices.some((c) => c.correct)
      if (!hasCorrect) {
        toast.error('请至少设置一个正确答案')
        return
      }
    }
    if (questionType === 'TEXT' && !textAnswer.trim()) {
      toast.error('请输入标准答案')
      return
    }
    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>新增{TYPE_TITLE[questionType]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as QuestionDifficulty)}
            >
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

          {(questionType === 'SINGLE_CHOICE' ||
            questionType === 'MULTIPLE_CHOICE') && (
            <ChoiceForm
              value={choiceValue}
              onChange={setChoiceValue}
              allowMultiple={questionType === 'MULTIPLE_CHOICE'}
            />
          )}
          {questionType === 'JUDGE' && (
            <JudgeForm value={judgeValue} onChange={setJudgeValue} />
          )}
          {questionType === 'TEXT' && (
            <TextForm value={textAnswer} onChange={setTextAnswer} />
          )}

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
