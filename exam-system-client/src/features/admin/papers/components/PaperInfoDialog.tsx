import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { toast } from 'sonner'
import { paperQueries } from '#/features/admin/papers/paperQueries.ts'
import type {
  PaperSaveInput,
  PaperUpdateInput,
} from '#/__generated/model/static'
import { api } from '#/ApiInstance.ts'
import CategoryTreePicker from '#/components/category-tree/CategoryTreePicker.tsx'
import { cn } from '#/lib/utils.ts'

interface PaperInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  paperId?: number
}

const STEPS = [
  { title: '考试信息', description: '编辑试卷基本信息' },
  { title: '设计试卷', description: '选择试卷题目' },
]

export default function PaperInfoDialog({
  open,
  onOpenChange,
  mode,
  paperId,
}: PaperInfoDialogProps) {
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)

  // 分类树
  const { data: treeData } = useQuery({
    queryKey: ['paper-category-tree'],
    queryFn: () => api.paperCategoryController.tree(),
    enabled: open,
  })
  const categoryTree = treeData?.data ?? []

  // 表单状态
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)

  // 编辑模式：加载试卷详情
  const { data: detailData } = useQuery({
    ...paperQueries.detail(paperId!),
    enabled: open && mode === 'edit' && !!paperId,
  })

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && detailData?.data) {
        const d = detailData.data
        setName(d.name)
        setDescription(d.description)
        setDuration(d.duration)
        setCategoryId(d.categoryId)
      } else {
        setName('')
        setCategoryId(undefined)
        setDescription('')
        setDuration(60)
      }
    }
  }, [open, mode, detailData])

  // 保存
  const saveMutation = useMutation({
    mutationFn: async () => {
      const common = {
        name,
        description,
        duration,
        categoryId: categoryId ? Number(categoryId) : undefined,
      }
      if (mode === 'edit' && paperId) {
        return paperQueries.update({
          id: paperId,
          ...common,
          questions: {},
        } as any as PaperUpdateInput)
      } else {
        return paperQueries.add({
          ...common,
          questions: {},
        } as any as PaperSaveInput)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listPapers'] })
      toast.success(mode === 'edit' ? '试卷更新成功' : '试卷创建成功')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('操作失败')
    },
  })

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('请填写试卷名称')
      return
    }
    if (!categoryId) {
      toast.error('请选择试卷分类')
      return
    }
    if (duration <= 0) {
      toast.error('时长必须大于 0')
      return
    }
    saveMutation.mutate()
  }

  const switchToStep = (index: number) => {
    if (index > currentStep) {
      if (currentStep === 0) {
        if (!name.trim()) {
          toast.error('请填写试卷名称')
          return
        }
        if (!categoryId) {
          toast.error('请选择试卷分类')
          return
        }
        if (duration <= 0) {
          toast.error('时长必须大于 0')
          return
        }
      }
    }
    setCurrentStep(index)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[95%] max-w-none overflow-y-scroll"
      >
        <DialogHeader>
          <DialogTitle className="flex flex-row items-center justify-between">
            <div className="text-base">
              {mode === 'edit' ? '编辑试卷' : '新增试卷'}
            </div>
            {/* 步骤指示器 */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((step, index) => (
                <button
                  key={index}
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => switchToStep(index)}
                >
                  {index > 0 && (
                    <span className="text-muted-foreground mx-1 h-px w-4 bg-current" />
                  )}
                  <div
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-lg',
                      index <= currentStep
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground border',
                    )}
                  >
                    {index + 1}
                  </div>
                  <div
                    className={cn(
                      index > currentStep && 'text-muted-foreground',
                    )}
                  >
                    {step.title}
                  </div>
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {STEPS[currentStep].description}
        </DialogDescription>
        <div className="bg-neutral-800 p-6">
          {currentStep === 0 ? (
            /* 步骤 1：考试信息 */
            <div className="bg-popover relative space-y-5 px-8 py-20">
              <div className="border-primary absolute top-5 left-0 border-l-8 pl-4 text-lg">
                基本信息
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  试卷名称
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入试卷名称"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  试卷分类
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <CategoryTreePicker
                  nodes={categoryTree}
                  value={categoryId ? categoryId : undefined}
                  onChange={(id) => setCategoryId(id)}
                  placeholder="选择分类"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="试卷描述（选填）"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">
                  时长（分钟）
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          ) : (
            /* 步骤 2：设计试卷（占位） */
            <div className="bg-popover flex items-center justify-center px-8 py-20">
              <p className="text-muted-foreground text-lg">
                设计试卷功能即将上线
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
