import type {
  PaperSaveInput,
  PaperUpdateInput,
} from '#/__generated/model/static'
import { Button, Input, Label } from '#/components/ui'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '#/components/ui/tabs.tsx'
import { useState } from 'react'
import { toast } from 'sonner'
import QuestionSelector from './QuestionSelector.tsx'

interface PaperFormProps {
  initialValues: {
    name: string
    description: string
    duration: number
    questions: Map<number, { score: number }>
  }
  isEdit: boolean
  onSave: (data: PaperSaveInput | PaperUpdateInput) => void
  onCancel: () => void
}

export default function PaperForm({
  initialValues,
  isEdit,
  onSave,
  onCancel,
}: PaperFormProps) {
  const [name, setName] = useState(initialValues.name)
  const [description, setDescription] = useState(initialValues.description)
  const [duration, setDuration] = useState(initialValues.duration)
  const [activeTab, setActiveTab] = useState('manual')
  const [selectedQuestions, setSelectedQuestions] = useState(
    initialValues.questions,
  )

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('请填写试卷名称')
      return
    }
    if (duration <= 0) {
      toast.error('时长必须大于0')
      return
    }

    const questions: { [key: string]: number } = {}
    selectedQuestions.forEach((value, key) => {
      questions[key.toString()] = value.score
    })

    if (isEdit) {
      onSave({
        name,
        description,
        duration,
        questions,
      } as PaperUpdateInput)
    } else {
      onSave({
        name,
        description,
        duration,
        questions,
      } as PaperSaveInput)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isEdit ? '编辑试卷' : '创建试卷'}
        </h1>
        <p className="text-muted-foreground">
          {isEdit ? '修改试卷信息' : '创建新试卷，从题库选择题目或使用规则组卷'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name">
            试卷名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入试卷名称"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="可选的试卷描述"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">
            时长(分钟) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={1}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manual">手动选题</TabsTrigger>
          <TabsTrigger value="rule">规则组卷</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4">
          <QuestionSelector
            selectedQuestions={selectedQuestions}
            onSelectionChange={setSelectedQuestions}
          />
        </TabsContent>

        <TabsContent value="rule" className="mt-4" />
      </Tabs>

      <div className="flex items-center gap-4 border-t pt-4">
        <Button onClick={handleSubmit}>保存试卷</Button>
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        {selectedQuestions.size > 0 && (
          <span className="text-muted-foreground text-sm">
            已选择 {selectedQuestions.size} 道题目，总分{' '}
            {Array.from(selectedQuestions.values()).reduce(
              (sum, q) => sum + q.score,
              0,
            )}{' '}
            分
          </span>
        )}
      </div>
    </div>
  )
}
