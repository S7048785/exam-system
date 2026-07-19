import { useForm } from '@tanstack/react-form'
import type { QuestionsCategoriesTree } from '#/__generated/model/static'
import { DIFFICULTY_OPTIONS, TYPE_OPTIONS } from './constants.ts'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'
import { toast } from 'sonner'

interface Step1ParamsProps {
  categories: readonly QuestionsCategoriesTree[]
  isGenerating: boolean
  onCancel: () => void
  onStartGenerate: (values: {
    count: number
    type: string
    difficulty: string
    categoryId: number | null
    includeMultiple: boolean
  }) => void
}

function flattenCategories(
  categories: readonly QuestionsCategoriesTree[],
  level: number = 0,
): Array<QuestionsCategoriesTree & { level: number }> {
  const result: Array<QuestionsCategoriesTree & { level: number }> = []
  for (const category of categories) {
    result.push({ ...category, level })
    if (category.children && category.children.length > 0) {
      result.push(...flattenCategories(category.children, level + 1))
    }
  }
  return result
}

export default function Step1Params({
  categories,
  isGenerating,
  onCancel,
  onStartGenerate,
}: Step1ParamsProps) {
  const flatCategories = flattenCategories(categories)

  const form = useForm({
    defaultValues: {
      count: 10,
      type: 'CHOICE',
      difficulty: 'MEDIUM',
      categoryId: null as number | null,
      includeMultiple: false,
    },
    onSubmit: ({ value }) => {
      if (!value.categoryId) {
        toast.error('请选择分类')
        return
      }
      onStartGenerate(value)
    },
  })

  return (
    <>
      <div className="space-y-6">
        {/* 生成数量 */}
        <form.Field
          name="count"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor="count">生成数量</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={50}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(
                    Math.max(1, Math.min(50, Number(e.target.value))),
                  )
                }
                placeholder="请输入生成数量"
              />
              <p className="text-muted-foreground text-xs">
                支持生成 1-50 道题目
              </p>
            </div>
          )}
        />
        {/* 题目类型 */}
        <form.Field
          name="type"
          children={(field) => (
            <div className="space-y-2">
              <Label>题目类型</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择题目类型" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
        <form.Subscribe selector={(state) => state.values.type}>
          {(type) => (
            <>
              {type == 'CHOICE' && (
                <form.Field
                  name="includeMultiple"
                  children={(field) => (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="multiple">包含多选题</Label>
                        <p className="text-muted-foreground text-xs">
                          是否在选择题中包含多选题
                        </p>
                      </div>
                      <Switch
                        id="multiple"
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                      />
                    </div>
                  )}
                />
              )}
            </>
          )}
        </form.Subscribe>
        {/* 难度 */}
        <form.Field
          name="difficulty"
          children={(field) => (
            <div className="space-y-2">
              <Label>难度</Label>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择难度" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {/* 分类 */}
        <form.Field
          name="categoryId"
          children={(field) => (
            <div className="space-y-2">
              <Label>分类</Label>
              <Select
                value={field.state.value?.toString() || ''}
                onValueChange={(val) => {
                  field.handleChange(val ? Number(val) : null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {flatCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {'　'.repeat(cat.level)}
                      {cat.level > 0 && '├ '}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      <DialogFooter className="mt-6 border-t px-0 py-4">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={() => form.handleSubmit()} disabled={isGenerating}>
          {isGenerating ? '生成中...' : '开始生成'}
        </Button>
      </DialogFooter>
    </>
  )
}
