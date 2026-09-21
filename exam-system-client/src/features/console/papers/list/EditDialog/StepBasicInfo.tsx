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
import type { PaperCategoriesTree } from '#/__generated/model/static'
import type { ParticipateMode } from '#/__generated/model/enums'

/** 参与方式：与后端 ParticipateMode 枚举一一对应 */
export const PARTICIPATE_MODES: Array<{
  value: ParticipateMode
  label: string
}> = [
  { value: 'LOGIN_REQUIRED', label: '账号登录考试' },
  { value: 'ANONYMOUS', label: '免登录考试' },
]

interface StepBasicInfoProps {
  name: string
  categoryId: number | undefined
  description: string
  duration: number
  /** 考试时间窗，值为 datetime-local 的字符串（YYYY-MM-DDTHH:mm） */
  start: string
  end: string
  participateMode: ParticipateMode
  maxAttempts: number
  categoryTree: readonly PaperCategoriesTree[]
  onNameChange: (v: string) => void
  onCategoryChange: (v: number | undefined) => void
  onDescriptionChange: (v: string) => void
  onDurationChange: (v: number) => void
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onParticipateModeChange: (v: ParticipateMode) => void
  onMaxAttemptsChange: (v: number) => void
}

export default function StepBasicInfo({
  name,
  categoryId,
  description,
  duration,
  start,
  end,
  participateMode,
  maxAttempts,
  categoryTree,
  onNameChange,
  onCategoryChange,
  onDescriptionChange,
  onDurationChange,
  onStartChange,
  onEndChange,
  onParticipateModeChange,
  onMaxAttemptsChange,
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start">
            开考时间
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="start"
            type="datetime-local"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">
            截止时间
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <Input
            id="end"
            type="datetime-local"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="participateMode">参与方式</Label>
          <Select
            value={participateMode}
            onValueChange={(val) =>
              onParticipateModeChange(val as ParticipateMode)
            }
          >
            <SelectTrigger id="participateMode">
              <SelectValue placeholder="选择参与方式" />
            </SelectTrigger>
            <SelectContent>
              {PARTICIPATE_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxAttempts">考试次数上限</Label>
          <Input
            id="maxAttempts"
            type="number"
            min={1}
            value={maxAttempts}
            onChange={(e) => onMaxAttemptsChange(Number(e.target.value))}
          />
          <p className="text-muted-foreground text-xs">
            开考即计入，中途放弃也算一次
          </p>
        </div>
      </div>
    </div>
  )
}
