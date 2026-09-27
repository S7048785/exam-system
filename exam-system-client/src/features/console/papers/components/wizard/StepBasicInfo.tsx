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
import CategoryTreePicker from '#/components/category-tree/CategoryTreePicker.tsx'
import type { TreeNode } from '#/components/category-tree/CategoryTreePicker.tsx'
import type { ParticipateMode } from '#/__generated/model/enums'

interface StepBasicInfoProps {
  name: string
  categoryId: number | undefined
  description: string
  participateMode: ParticipateMode
  categoryTree: readonly TreeNode[]
  onNameChange: (v: string) => void
  onCategoryChange: (v: number | undefined) => void
  onDescriptionChange: (v: string) => void
  onParticipateModeChange: (v: ParticipateMode) => void
}

/**
 * 向导第 0 步「考试信息」：只收试卷自身的 4 个字段。
 *
 * 时长 / 起止时间 / 次数上限 / 及格分 / 8 项开关都属于「考试设置」，存在 1:1 的
 * `paper_exam_settings` 里：建卷**不再**预写设置行，发布前必须先配好（见 SaveDialog 的
 * goPublish），之后也可以在**列表页行的「设置」弹窗**里改。
 * （`POST /paper/save` 只负责这 4 个字段。）
 */
export default function StepBasicInfo({
  name,
  categoryId,
  description,
  participateMode,
  categoryTree,
  onNameChange,
  onCategoryChange,
  onDescriptionChange,
  onParticipateModeChange,
}: StepBasicInfoProps) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-5 overflow-y-auto">
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
          onChange={onCategoryChange}
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
        <Label htmlFor="participateMode">
          考生参与方式
          <span className="text-destructive ml-0.5">*</span>
        </Label>
        <Select
          value={participateMode}
          onValueChange={(v) => onParticipateModeChange(v as ParticipateMode)}
        >
          <SelectTrigger id="participateMode" className="w-full">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOGIN_REQUIRED">账号登录考试</SelectItem>
            <SelectItem value="ANONYMOUS">免登录考试</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-muted-foreground text-xs">
        考试时长、起止时间、次数上限、及格分与各项考试开关，保存后到列表页该试卷的「设置」里配置。
      </p>
    </div>
  )
}
