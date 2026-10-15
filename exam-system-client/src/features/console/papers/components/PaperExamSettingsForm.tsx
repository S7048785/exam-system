import { useState } from 'react'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Checkbox } from '#/components/ui/checkbox.tsx'
import { toast } from 'sonner'
import z from 'zod'
import {
  defaultTimeWindow,
  toApiDateTime,
  toLocalInput,
} from '#/features/console/papers/time-window.ts'
import type { PaperExamSettingsInput } from '#/__generated/model/static'

/**
 * `paper_exam_settings` 的扁平表单值（13 项）。
 *
 * 时间用 `<input type="datetime-local">` 的本地串（`YYYY-MM-DDTHH:mm`）；
 * `minAnswerMinutes === null` 表示不启用「至少作答 x 分钟」限制。
 */
export interface PaperExamSettingsValues {
  duration: number
  start: string
  end: string
  passingScore: number
  maxAttempts: number
  requireAllAnswered: boolean
  hideQuestionScore: boolean
  showRankAfterSubmit: boolean
  showAnswerAfterSubmit: boolean
  minAnswerMinutes: number | null
  shuffleQuestions: boolean
  shuffleChoices: boolean
}

/**
 * 后端详情里的 `examSettings` → 表单值。
 *
 * 只声明用得上的字段（结构化匹配），不直接依赖生成 DTO 的具体类型名 ——
 * `bun run api` 重新生成后类型改名也不会连累这里。
 */
type ExamSettingsLike = {
  duration: number
  start: string
  end: string
  passingScore?: number | null
  maxAttempts: number
  requireAllAnswered?: boolean | null
  hideQuestionScore?: boolean | null
  showRankAfterSubmit?: boolean | null
  showAnswerAfterSubmit?: boolean | null
  minAnswerMinutes?: number | null
  shuffleQuestions?: boolean | null
  shuffleChoices?: boolean | null
}

export const toFormValues = (
  s?: ExamSettingsLike | null,
): Partial<PaperExamSettingsValues> => {
  if (!s) return {}
  return {
    duration: s.duration,
    start: toLocalInput(s.start),
    end: toLocalInput(s.end),
    passingScore: s.passingScore ?? 0,
    maxAttempts: s.maxAttempts,
    requireAllAnswered: s.requireAllAnswered ?? false,
    hideQuestionScore: s.hideQuestionScore ?? false,
    showRankAfterSubmit: s.showRankAfterSubmit ?? false,
    showAnswerAfterSubmit: s.showAnswerAfterSubmit ?? false,
    minAnswerMinutes:
      s.minAnswerMinutes != null && s.minAnswerMinutes > 0
        ? s.minAnswerMinutes
        : null,
    shuffleQuestions: s.shuffleQuestions ?? false,
    shuffleChoices: s.shuffleChoices ?? false,
  }
}

/**
 * 表单值 → 后端 `PaperExamSettingsInput`。
 *
 * 字段映射**只在这一处**，后端加字段时改这里 + 上面的类型即可，
 * 不用在调用方各写一遍。
 */
export const toApiInput = (
  v: PaperExamSettingsValues,
): PaperExamSettingsInput => ({
  duration: v.duration,
  start: toApiDateTime(v.start),
  end: toApiDateTime(v.end),
  passingScore: v.passingScore,
  maxAttempts: v.maxAttempts,
  requireAllAnswered: v.requireAllAnswered,
  hideQuestionScore: v.hideQuestionScore,
  showRankAfterSubmit: v.showRankAfterSubmit,
  showAnswerAfterSubmit: v.showAnswerAfterSubmit,
  minAnswerMinutes: v.minAnswerMinutes,
  shuffleQuestions: v.shuffleQuestions,
  shuffleChoices: v.shuffleChoices,
})

/** 6 项开关（key 与后端 `PaperExamSettingsInput` 同名字段），按现有分组展示 */
type SwitchKey =
  | 'showRankAfterSubmit'
  | 'showAnswerAfterSubmit'
  | 'shuffleQuestions'
  | 'shuffleChoices'
  | 'requireAllAnswered'
  | 'hideQuestionScore'

const SWITCH_GROUPS: ReadonlyArray<{
  title: string
  items: ReadonlyArray<{ key: SwitchKey; label: string }>
}> = [
  {
    title: '考试设置',
    items: [
      { key: 'showRankAfterSubmit', label: '交卷后显示考生名次' },
      { key: 'showAnswerAfterSubmit', label: '交卷后允许查看标准答案' },
    ],
  },
  {
    title: '基础防作弊',
    items: [
      { key: 'shuffleQuestions', label: '试题乱序' },
      { key: 'shuffleChoices', label: '选项乱序' },
    ],
  },
  {
    title: '试题设置',
    items: [
      { key: 'requireAllAnswered', label: '必须答完所有试题才可提交试卷' },
      { key: 'hideQuestionScore', label: '不显示试题分数' },
    ],
  },
]

const schema = z
  .object({
    duration: z.number('时长必须大于 0').gt(0, '时长必须大于 0'),
    start: z.string().min(1, '请填写开考时间与截止时间'),
    end: z.string().min(1, '请填写开考时间与截止时间'),
    passingScore: z.number('及格分不能小于 0').min(0, '及格分不能小于 0'),
    maxAttempts: z
      .number('考试次数上限不能小于 1')
      .min(1, '考试次数上限不能小于 1'),
  })
  // 起止时间缺失时交给上面的必填校验报错，这里只比先后
  .refine((v) => !v.start || !v.end || new Date(v.end) >= new Date(v.start), {
    message: '截止时间不能早于开考时间',
    path: ['end'],
  })

interface Props {
  /**
   * 初始值（来自详情）。**只在组件挂载时读一次** ——
   * 调用方应在数据就绪后再渲染本组件（或换 `key`）来达到"重新初始化"的效果，
   * 这样详情缓存刷新不会冲掉用户正在编辑的内容。
   */
  defaultValues?: Partial<PaperExamSettingsValues>
  submitting?: boolean
  submitLabel?: string
  onCancel?: () => void
  onSubmit: (values: PaperExamSettingsValues) => void
}

export default function PaperExamSettingsForm({
  defaultValues,
  submitting = false,
  submitLabel = '保存',
  onCancel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<PaperExamSettingsValues>(() => ({
    duration: 60,
    ...defaultTimeWindow(),
    passingScore: 0,
    maxAttempts: 1,
    requireAllAnswered: false,
    hideQuestionScore: false,
    showRankAfterSubmit: false,
    showAnswerAfterSubmit: false,
    minAnswerMinutes: null,
    shuffleQuestions: false,
    shuffleChoices: false,
    ...defaultValues,
  }))

  const patch = (p: Partial<PaperExamSettingsValues>) =>
    setValues((prev) => ({ ...prev, ...p }))

  /**
   * 6 项开关统一走这里。
   * 动态 key 的 `{ [k]: v }` 会被 TS 推成 `{ [x: string]: boolean }` 索引签名，
   * 赋给具体类型会报错，所以这里收口 + 断言一次，别让调用方各自加 as。
   */
  const setSwitch = (key: SwitchKey, value: boolean) =>
    setValues((prev) => ({ ...prev, [key]: value }) as PaperExamSettingsValues)

  const handleSubmit = () => {
    const checked = schema.safeParse({
      duration: values.duration,
      start: values.start,
      end: values.end,
      passingScore: values.passingScore,
      maxAttempts: values.maxAttempts,
    })
    if (!checked.success) {
      toast.error(checked.error.issues[0].message)
      return
    }
    if (
      values.minAnswerMinutes != null &&
      (!values.minAnswerMinutes || values.minAnswerMinutes <= 0)
    ) {
      toast.error('至少作答分钟数必须大于 0')
      return
    }
    onSubmit(values)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ps-duration">考试时长（分钟）</Label>
            <Input
              id="ps-duration"
              type="number"
              min={1}
              value={values.duration}
              onChange={(e) => patch({ duration: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-attempts">考试次数上限</Label>
            <Input
              id="ps-attempts"
              type="number"
              min={1}
              value={values.maxAttempts}
              onChange={(e) => patch({ maxAttempts: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-start">开考时间</Label>
            <Input
              id="ps-start"
              type="datetime-local"
              value={values.start}
              onChange={(e) => patch({ start: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-end">截止时间</Label>
            <Input
              id="ps-end"
              type="datetime-local"
              value={values.end}
              onChange={(e) => patch({ end: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-passing">
              及格分<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="ps-passing"
              type="number"
              min={0}
              value={values.passingScore}
              onChange={(e) => patch({ passingScore: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-min">至少作答时长</Label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={values.minAnswerMinutes != null}
                  onCheckedChange={(v) =>
                    patch({ minAnswerMinutes: v === true ? 30 : null })
                  }
                />
                限制
              </label>
              <Input
                id="ps-min"
                type="number"
                min={1}
                className="w-24"
                disabled={values.minAnswerMinutes == null}
                value={values.minAnswerMinutes ?? ''}
                onChange={(e) =>
                  patch({ minAnswerMinutes: Number(e.target.value) })
                }
                placeholder="分钟"
              />
              <span className="text-muted-foreground text-sm">
                分钟后才能交卷
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {SWITCH_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-muted-foreground text-xs">{group.title}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((s) => (
                  <label
                    key={s.key}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={values[s.key]}
                      onCheckedChange={(v) => setSwitch(s.key, v === true)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t pt-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? '保存中…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
