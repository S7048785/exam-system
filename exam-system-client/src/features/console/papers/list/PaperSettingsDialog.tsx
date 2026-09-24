import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Checkbox } from '#/components/ui/checkbox.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import CategoryTreePicker from '#/components/category-tree/CategoryTreePicker.tsx'
import { api } from '#/ApiInstance.ts'
import { paperQueries } from '#/features/console/papers/paperQueries.ts'
import {
  defaultTimeWindow,
  toApiDateTime,
  toLocalInput,
} from '#/features/console/papers/time-window.ts'
import type {
  PaperExamSettingsInput,
  PaperSaveInput,
} from '#/__generated/model/static'
import type { ParticipateMode } from '#/__generated/model/enums'
import { toast } from 'sonner'
import z from 'zod'

interface PaperSettingsDialogProps {
  paperId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 列表行「设置」→ 试卷配置弹窗。
 *
 * 一次保存打两个接口（后端把"试卷基本信息"和"考试设置"拆成了两张表）：
 * 1. `POST /paper/save`（带 id = 更新）：名称 / 描述 / 分类 / 参与方式
 * 2. `PUT /paper/{id}/exam-settings`（扁平 13 字段）：时长 / 起止 / 及格分 / 次数 + 8 项开关
 */
const paperSettingsSchema = z
  .object({
    name: z.string().trim().min(1, '请填写试卷名称'),
    categoryId: z.number('请选择试卷分类'),
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

/** 6 项开关（key 与后端 PaperExamSettingsInput 同名字段），按你给的分组展示 */
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

export default function PaperSettingsDialog({
  paperId,
  open,
  onOpenChange,
}: PaperSettingsDialogProps) {
  const queryClient = useQueryClient()

  // 试卷基本信息
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [participateMode, setParticipateMode] =
    useState<ParticipateMode>('LOGIN_REQUIRED')

  // 考试设置
  const [duration, setDuration] = useState(60)
  const [start, setStart] = useState(() => defaultTimeWindow().start)
  const [end, setEnd] = useState(() => defaultTimeWindow().end)
  // 及格分：必填，默认 0
  const [passingScore, setPassingScore] = useState(0)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [switches, setSwitches] = useState<Record<string, boolean>>({})
  // 「考生至少作答 x 分钟」：先勾选才启用分钟数（未勾选提交 null）
  const [minAnswerEnabled, setMinAnswerEnabled] = useState(false)
  const [minAnswerMinutes, setMinAnswerMinutes] = useState(30)

  const { data: treeData } = useQuery({
    queryKey: ['paper-category-tree'],
    queryFn: () => api.paperCategoryController.tree(),
    enabled: open,
  })
  const categoryTree = treeData?.data ?? []

  const { data: detailData } = useQuery({
    ...paperQueries.detail(paperId),
    enabled: open,
  })

  // 打开时用详情回填（考试设置是 1:1 子表，字段都在 examSettings 里）
  useEffect(() => {
    if (!open) return
    const d = detailData?.data
    if (!d) return
    setName(d.name)
    setDescription(d.description ?? '')
    setCategoryId(d.categoryId)
    setParticipateMode(d.participateMode)
    const s = d.examSettings
    if (s) {
      setDuration(s.duration)
      setStart(toLocalInput(s.start))
      setEnd(toLocalInput(s.end))
      setPassingScore(s.passingScore ?? 0)
      setMaxAttempts(s.maxAttempts)
      setSwitches({
        requireAllAnswered: s.requireAllAnswered ?? false,
        hideQuestionScore: s.hideQuestionScore ?? false,
        showRankAfterSubmit: s.showRankAfterSubmit ?? false,
        showAnswerAfterSubmit: s.showAnswerAfterSubmit ?? false,
        shuffleQuestions: s.shuffleQuestions ?? false,
        shuffleChoices: s.shuffleChoices ?? false,
      })
      const min = s.minAnswerMinutes
      setMinAnswerEnabled(min != null && min > 0)
      setMinAnswerMinutes(min != null && min > 0 ? min : 30)
    }
  }, [open, detailData])

  const savePaperMutation = useMutation({
    mutationFn: (body: PaperSaveInput) =>
      api.paperController.savePaperV2({ body }),
  })
  const saveSettingsMutation = useMutation({
    mutationFn: (body: PaperExamSettingsInput) =>
      api.paperController.updatePaperExamSettings({ id: paperId, body }),
  })

  const saving = savePaperMutation.isPending || saveSettingsMutation.isPending

  const handleSave = async () => {
    const checked = paperSettingsSchema.safeParse({
      name,
      categoryId,
      duration,
      start,
      end,
      passingScore,
      maxAttempts,
    })
    if (!checked.success) {
      toast.error(checked.error.issues[0].message)
      return
    }
    if (minAnswerEnabled && (!minAnswerMinutes || minAnswerMinutes <= 0)) {
      toast.error('至少作答分钟数必须大于 0')
      return
    }

    try {
      // 1) 试卷基本信息（带 id = 更新）
      await savePaperMutation.mutateAsync({
        id: paperId,
        name,
        description,
        categoryId: categoryId!,
        participateMode,
      })
      // 2) 考试设置（扁平 13 字段）
      await saveSettingsMutation.mutateAsync({
        duration,
        start: toApiDateTime(start),
        end: toApiDateTime(end),
        passingScore,
        maxAttempts,
        requireAllAnswered: switches.requireAllAnswered ?? false,
        hideQuestionScore: switches.hideQuestionScore ?? false,
        showRankAfterSubmit: switches.showRankAfterSubmit ?? false,
        showAnswerAfterSubmit: switches.showAnswerAfterSubmit ?? false,
        minAnswerMinutes: minAnswerEnabled ? minAnswerMinutes : null,
        shuffleQuestions: switches.shuffleQuestions ?? false,
        shuffleChoices: switches.shuffleChoices ?? false,
      })
      await queryClient.invalidateQueries({ queryKey: ['paperDetail', paperId] })
      await queryClient.invalidateQueries({ queryKey: ['listPapers'] })
      toast.success('试卷设置已保存')
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[92%] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>试卷设置</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          修改试卷基本信息与考试设置
        </DialogDescription>

        <div className="flex-1 space-y-6 overflow-y-auto px-1 py-2">
          {/* 基本信息 */}
          <section className="space-y-4">
            <div className="text-muted-foreground text-xs">基本信息</div>
            <div className="space-y-2">
              <Label htmlFor="ps-name">
                试卷名称<span className="text-destructive ml-0.5">*</span>
              </Label>
              <Input
                id="ps-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入试卷名称"
              />
            </div>
            <div className="space-y-2">
              <Label>试卷分类</Label>
              <CategoryTreePicker
                nodes={categoryTree}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="选择分类"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ps-desc">描述</Label>
              <Input
                id="ps-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="试卷描述（选填）"
              />
            </div>
          </section>

          {/* 考试设置 */}
          <section className="space-y-4">
            <div className="text-muted-foreground text-xs">考试设置</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ps-duration">考试时长（分钟）</Label>
                <Input
                  id="ps-duration"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-attempts">考试次数上限</Label>
                <Input
                  id="ps-attempts"
                  type="number"
                  min={1}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-start">开考时间</Label>
                <Input
                  id="ps-start"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-end">截止时间</Label>
                <Input
                  id="ps-end"
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
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
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ps-min">至少作答时长</Label>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={minAnswerEnabled}
                      onCheckedChange={(v) => setMinAnswerEnabled(v === true)}
                    />
                    限制
                  </label>
                  <Input
                    id="ps-min"
                    type="number"
                    min={1}
                    className="w-24"
                    disabled={!minAnswerEnabled}
                    value={minAnswerEnabled ? minAnswerMinutes : ''}
                    onChange={(e) => setMinAnswerMinutes(Number(e.target.value))}
                    placeholder="分钟"
                  />
                  <span className="text-muted-foreground text-sm">分钟后才能交卷</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {SWITCH_GROUPS.map((group) => (
                <div key={group.title} className="space-y-2">
                  <div className="text-muted-foreground text-xs">
                    {group.title}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.items.map((s) => (
                      <label
                        key={s.key}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={switches[s.key] ?? false}
                          onCheckedChange={(v) =>
                            setSwitches((prev) => ({
                              ...prev,
                              [s.key]: v === true,
                            }))
                          }
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t pt-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
