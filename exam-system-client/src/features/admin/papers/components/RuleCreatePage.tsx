import { api } from '#/ApiInstance.ts'
import { FancyMultiSelect } from '#/components/fancy-multi-select.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import { categoryTreeQueryOptions } from '#/features/admin/questions/questionQueries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useImmer } from 'use-immer'

// 1. 定义题型名称映射，方便维护
const TYPE_LABELS: Record<string, string> = {
  CHOICE: '选择题',
  JUDGE: '判断题',
  TEXT: '简答题',
}

interface Rule {
  type: string
  categoryIds: number[]
  count: number
  score: number
}

export default function RuleCreatePage() {
  const [rules, setRules] = useImmer<Rule[]>([
    { type: 'CHOICE', categoryIds: [], count: 5, score: 5 },
    { type: 'JUDGE', categoryIds: [], count: 5, score: 5 },
    { type: 'TEXT', categoryIds: [], count: 2, score: 10 },
  ])
  const [isGenerating, setIsGenerating] = useState(false)

  const [paperName, setPaperName] = useState('')
  const [paperDescription, setPaperDescription] = useState('')
  const [paperDuration, setPaperDuration] = useState(60)
  const navigate = useNavigate()
  // 获取分类树
  const { data: categoryData } = useSuspenseQuery(categoryTreeQueryOptions)

  const categories = useMemo(
    () => [
      categoryData.data[0].children,
      categoryData.data[1].children,
      categoryData.data[2].children,
    ],
    [categoryData.data],
  )

  // 2. 优化：使用泛型更新函数
  const updateRule = <TKey extends keyof Rule>(
    index: number,
    field: TKey,
    value: Rule[TKey],
  ) => {
    setRules((draft) => {
      ;(draft[index][field] as Rule[TKey]) = value
    })
  }
  // 生成试卷
  const handleGenerate = async () => {
    if (!paperName.trim()) return toast.error('请先填写试卷名称')
    if (paperDuration <= 0) return toast.error('时长必须大于0')

    setIsGenerating(true)
    try {
      await api.paperController.aiPaper({
        body: {
          name: paperName,
          description: paperDescription,
          duration: paperDuration,
          rules: rules.filter((r) => r.categoryIds.length > 0 && r.count > 0),
        },
      })

      // AI生成接口调用后会重置页面状态
      toast.success('试卷生成成功')
      navigate({ to: '/admin/papers/list' })
    } catch (error: any) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name">
            试卷名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={paperName}
            onChange={(e) => setPaperName(e.target.value)}
            placeholder="请输入试卷名称"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Input
            id="description"
            value={paperDescription}
            onChange={(e) => setPaperDescription(e.target.value)}
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
            value={paperDuration}
            onChange={(e) => setPaperDuration(Number(e.target.value))}
            min={1}
          />
        </div>
      </div>
      <div className="text-muted-foreground text-sm">
        配置每种题型的数量和分数，系统将自动从题库中抽取题目组卷
      </div>

      {/* 规则配置表格 */}
      <div className="rounded-md border">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 border-b">
              <TableHead className="px-4 py-3 text-left text-sm font-medium">
                题型
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-medium">
                选择分类
              </TableHead>
              <TableHead className="w-[100px] px-4 py-3 text-left text-sm font-medium">
                题目数量
              </TableHead>
              <TableHead className="w-[100px] px-4 py-3 text-left text-sm font-medium">
                每题分数
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 4. 优化：数据驱动循环渲染 */}
            {rules.map((rule, index) => (
              <TableRow key={rule.type}>
                <TableCell className="font-medium">
                  {TYPE_LABELS[rule.type] || rule.type}
                </TableCell>
                <TableCell>
                  {/* 记得绑定 value 和 onChange */}
                  <FancyMultiSelect
                    categories={categories[index] || []}
                    value={rule.categoryIds}
                    onChange={(ids) => updateRule(index, 'categoryIds', ids)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={rule.count}
                    onChange={(e) =>
                      updateRule(
                        index,
                        'count',
                        Math.max(0, Number(e.target.value)),
                      )
                    }
                    min={0}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={rule.score}
                    onChange={(e) =>
                      updateRule(
                        index,
                        'score',
                        Math.max(0, Number(e.target.value)),
                      )
                    }
                    min={0}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex w-full items-center justify-around">
        {/* 统计信息 */}
        <div className="">
          <div className="">
            总题数:
            <strong className="ml-4">
              {rules.reduce((sum, r) => sum + r.count, 0)}
            </strong>{' '}
            道
          </div>
          <div className="text-lg">
            总分:
            <strong className="ml-4">
              {rules.reduce((sum, r) => sum + r.count * r.score, 0)}
            </strong>{' '}
            分
          </div>
        </div>

        {/* 生成按钮 */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="gap-2 px-8"
        >
          {isGenerating && <Loader2 className="size-4 animate-spin" />}
          生成试卷
        </Button>
      </div>
    </div>
  )
}
