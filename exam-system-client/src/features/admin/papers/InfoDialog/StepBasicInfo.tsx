import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'
import CategoryTreePicker from '#/components/category-tree/CategoryTreePicker.tsx'
import type { PaperCategoriesTree } from '#/__generated/model/static'

interface StepBasicInfoProps {
  name: string
  categoryId: number | undefined
  description: string
  duration: number
  categoryTree: readonly PaperCategoriesTree[]
  onNameChange: (v: string) => void
  onCategoryChange: (v: number | undefined) => void
  onDescriptionChange: (v: string) => void
  onDurationChange: (v: number) => void
}

export default function StepBasicInfo({
  name,
  categoryId,
  description,
  duration,
  categoryTree,
  onNameChange,
  onCategoryChange,
  onDescriptionChange,
  onDurationChange,
}: StepBasicInfoProps) {
  return (
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
          onChange={(e) => onNameChange(e.target.value)}
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
          value={categoryId}
          onChange={(id) => onCategoryChange(id)}
          placeholder="选择分类"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
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
          onChange={(e) => onDurationChange(Number(e.target.value))}
          required
        />
      </div>
    </div>
  )
}
