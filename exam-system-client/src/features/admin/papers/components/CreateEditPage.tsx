import type {
  PaperSaveInput,
  PaperUpdateInput,
} from '#/__generated/model/static'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '#/components/ui/tabs.tsx'
import { Route } from '#/routes/admin/papers/$id.edit.tsx'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { paperDetailQueryOptions, paperQueries } from '../paperQueries.ts'
import QuestionSelector from './QuestionSelector.tsx'

export default function CreateEditPage() {
  const { id } = Route.useParams()

  const paperId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!paperId

  // 表单数据
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [activeTab, setActiveTab] = useState('manual')
  const [selectedQuestions, setSelectedQuestions] = useState<
    Map<number, { score: number }>
  >(new Map())

  const { data: paperDetail } = useSuspenseQuery(
    paperDetailQueryOptions(paperId),
  )

  // 填充编辑数据
  useEffect(() => {
    if (paperDetail.data) {
      setName(paperDetail.data.name)
      setDescription(paperDetail.data.description ?? '')
      setDuration(paperDetail.data.duration)

      // 将已有题目转换为 selectedQuestions Map
      const questionMap = new Map<number, { score: number }>()
      paperDetail.data.questions.forEach((q: any) => {
        questionMap.set(q.id, { score: q.score ?? 5 })
      })
      setSelectedQuestions(questionMap)
    }
  }, [paperDetail])

  // 保存试卷
  const saveMutation = useMutation({
    mutationFn: (data: PaperSaveInput | PaperUpdateInput) => {
      if (isEdit) {
        return paperQueries.update(data as PaperUpdateInput)
      }
      return paperQueries.add(data as PaperSaveInput)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] })
      toast.success(isEdit ? '试卷更新成功' : '试卷创建成功')
      navigate({ to: '/admin/papers/list' })
    },
    onError: () => {
      toast.error(isEdit ? '更新失败' : '创建失败')
    },
  })

  // 提交表单
  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('请填写试卷名称')
      return
    }
    if (duration <= 0) {
      toast.error('时长必须大于0')
      return
    }

    // 将 Map 转换为后端需要的格式: { [questionId: string]: score }
    const questions: { [key: string]: number } = {}
    selectedQuestions.forEach((value, key) => {
      questions[key.toString()] = value.score
    })

    if (isEdit) {
      const submitData: PaperUpdateInput = {
        id: paperId,
        name,
        description,
        duration,
        questions,
      }
      saveMutation.mutate(submitData)
    } else {
      const submitData: PaperSaveInput = {
        name,
        description,
        duration,
        questions,
      }
      saveMutation.mutate(submitData)
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

      {/* 基本信息 */}
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

      {/* Tab 切换 */}
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

        <TabsContent value="rule" className="mt-4"></TabsContent>
      </Tabs>

      {/* 底部操作栏 */}
      <div className="flex items-center gap-4 border-t pt-4">
        <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? '保存中...' : '保存试卷'}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/admin/papers/create' })}
        >
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
