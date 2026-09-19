import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import type { QuestionsPageView } from '#/__generated/model/static'
import {
  nextTempChoiceId,
  type ChoiceRow,
  type QuestionSaveReq,
  type QuestionUpdatePayload,
} from '#/types/question-save.ts'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { toast } from 'sonner'
import { useIsMobile } from '#/hooks/use-mobile.ts'
import ChoiceForm from './ChoiceForm.tsx'
import JudgeForm from './JudgeForm.tsx'
import TextForm from './TextForm.tsx'
import { flattenCategories } from '#/features/controller/questions/utils.ts'
import type { Difficulty, QuestionType } from '#/types/questoin.ts'
import { DIFFICULTIES, QUESTION_TYPES } from '#/types/questoin.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { categoryTreeQueryOptions } from '#/features/controller/questions/questionQueries.ts'

interface QuestionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  question: QuestionsPageView | null
  /** add 模式发 QuestionSaveReq（POST /question/add）；edit 模式发 QuestionUpdatePayload（PUT /question/update） */
  onSubmit: (values: QuestionSaveReq | QuestionUpdatePayload) => void
}

export default function QuestionDrawer({
  open,
  onOpenChange,
  mode,
  question,
  onSubmit,
}: QuestionDrawerProps) {
  const isMobile = useIsMobile()

  const { data: categoryData } = useSuspenseQuery(categoryTreeQueryOptions)
  const categories = categoryData.data
  const flatCategories = flattenCategories(categories)

  // 各题型特有数据
  const [choiceData, setChoiceData] = useState<{
    analysis: string
    choices: ChoiceRow[]
  }>({
    analysis: '',
    choices: [
      { content: '', correct: false },
      { content: '', correct: false },
    ],
  })

  const [judgeData, setJudgeData] = useState({
    analysis: '',
    judgeAnswer: 'true',
  })

  const [textAnswer, setTextAnswer] = useState('')

  const form = useForm({
    defaultValues: {
      type: question?.type || 'SINGLE_CHOICE',
      title: question?.title || '',
      difficulty: question?.difficulty || ('MEDIUM' as Difficulty),
      score: question?.score ?? 1,
      categoryId: question?.categoryId || undefined,
      analysis: question?.analysis || '',
      answers: question?.answers ?? '',
    },
    onSubmit: async ({ value }) => {
      if (!value.title.trim()) {
        toast.error('请输入题目内容')
        return
      }
      if (!value.categoryId) {
        toast.error('请选择分类')
        return
      }
      const baseData = {
        title: value.title.trim(),
        difficulty: value.difficulty,
        score: value.score!,
        categoryId: value.categoryId!,
        analysis: value.analysis.trim(),
      }
      // 编辑模式：PUT /question/update 的提交体与 add 完全不同（没有 type/extra，
      // 且 choices/answers 都要带服务端 id）
      const isEdit = mode === 'edit' && !!question

      if (value.type === 'SINGLE_CHOICE' || value.type === 'MULTIPLE_CHOICE') {
        const filledChoices = choiceData.choices.filter((c) => c.content.trim())
        if (filledChoices.length < 2) {
          toast.error('选择题至少需要两个选项')
          return
        }
        const hasCorrect = filledChoices.some((c) => c.correct)
        if (!hasCorrect) {
          toast.error('请至少选择一个正确答案')
          return
        }

        if (isEdit) {
          // 正确答案字母串（服务端 question_answers.answer 存的就是 "A" / "A,C"）
          const answerLetters = filledChoices
            .map((c, i) => (c.correct ? String.fromCharCode(65 + i) : ''))
            .filter(Boolean)
            .join(',')
          onSubmit({
            id: question.id,
            ...baseData,
            choices: filledChoices.map((c, i) => ({
              id: c.id ?? nextTempChoiceId(),
              content: c.content.trim(),
              correct: c.correct,
              sort: i,
            })),
            answers: question.answers?.id
              ? { id: question.answers.id, answer: answerLetters }
              : undefined,
          })
          return
        }

        const choices = filledChoices.map((c, i) => ({
          content: c.content.trim(),
          correct: c.correct,
          sort: i,
        }))
        // ⚠️ type 必须同时出现在顶层（QuestionSaveReq.type）和 extra 内部
        // （QuestionExtra 的 @JsonTypeInfo(As.EXTERNAL_PROPERTY) 实际是从 extra 内部取判别值，实测）
        onSubmit({ ...baseData, type: value.type, extra: { type: value.type, choices } })
        return
      }

      if (value.type === 'JUDGE') {
        if (isEdit) {
          onSubmit({
            id: question.id,
            ...baseData,
            choices: [],
            answers: question.answers?.id
              ? { id: question.answers.id, answer: judgeData.judgeAnswer }
              : undefined,
          })
          return
        }
        onSubmit({
          ...baseData,
          type: 'JUDGE',
          extra: { type: 'JUDGE', answer: judgeData.judgeAnswer },
        })
        return
      }

      const text = textAnswer.trim()
      if (isEdit) {
        onSubmit({
          id: question.id,
          ...baseData,
          choices: [],
          answers: question.answers?.id
            ? { id: question.answers.id, answer: text }
            : undefined,
        })
        return
      }
      onSubmit({
        ...baseData,
        type: 'TEXT',
        extra: { type: 'TEXT', answer: text || undefined },
      })
    },
  })

  // 监听 open 状态，重置表单
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && question) {
        form.reset({
          type: question.type as QuestionType,
          title: question.title,
          difficulty: question.difficulty as Difficulty,
          score: question.score,
          answers: question.answers,
          analysis: question.analysis || '',
          categoryId: question.categoryId || undefined,
        })
      } else {
        form.reset({
          type: 'SINGLE_CHOICE',
          title: '',
          difficulty: 'MEDIUM',
          score: 1,
          analysis: '',
          answers: '',
          categoryId: undefined,
        })
        setChoiceData({
          analysis: '',
          choices: [
            { content: '', correct: false },
            { content: '', correct: false },
          ],
        })
        setJudgeData({ analysis: '', judgeAnswer: 'true' })
        setTextAnswer('')
      }
    }
  }, [open, mode, question])

  return (
    <Drawer
      direction={isMobile ? 'bottom' : 'right'}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{mode === 'add' ? '新增题目' : '编辑题目'}</DrawerTitle>
          <DrawerDescription>
            {mode === 'add'
              ? '创建一道新的题目'
              : `编辑题目「${question?.title}」`}
          </DrawerDescription>
        </DrawerHeader>

        <div
          data-vaul-no-drag
          className="flex flex-col gap-4 overflow-y-auto px-4 text-sm"
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* 题目类型 */}
            <form.Field
              name="type"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="type">题目类型</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) =>
                      field.handleChange(val as QuestionType)
                    }
                    disabled={mode === 'edit'}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="选择题目类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mode === 'edit' && (
                    <p className="text-muted-foreground text-xs">
                      编辑模式下不可修改题目类型
                    </p>
                  )}
                </div>
              )}
            />

            {/* 题目内容 */}
            <form.Field
              name="title"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="title">题目内容</Label>
                  <Input
                    id="title"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="请输入题目内容"
                  />
                </div>
              )}
            />
            {
              <form.Field
                name={'categoryId'}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">分类</Label>
                    <Select
                      value={field.state.value?.toString()}
                      onValueChange={(val) => field.handleChange(Number(val))}
                    >
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="选择分类" />
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
            }

            <form.Subscribe selector={(state) => state.values.type}>
              {(type) => (
                <>
                  {/* 选择题特有字段 */}
                  {(type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') && (
                    <ChoiceForm
                      value={choiceData}
                      onChange={setChoiceData}
                      editData={mode === 'edit' ? question : null}
                      allowMultiple={type === 'MULTIPLE_CHOICE'}
                    />
                  )}

                  {/* 判断题特有字段 */}
                  {type === 'JUDGE' && (
                    <JudgeForm
                      value={judgeData}
                      onChange={setJudgeData}
                      editData={mode === 'edit' ? question : null}
                    />
                  )}

                  {/* 简答题特有字段 */}
                  {type === 'TEXT' && (
                    <TextForm
                      value={textAnswer}
                      onChange={setTextAnswer}
                      editData={mode === 'edit' ? question : null}
                    />
                  )}
                </>
              )}
            </form.Subscribe>

            {/* 难度（公共字段） */}
            <form.Field
              name="difficulty"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="difficulty">难度</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) =>
                      field.handleChange(val as Difficulty)
                    }
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="选择难度" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            {/* 分值（公共字段） */}
            <form.Field
              name="score"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="score">分值</Label>
                  <Input
                    id="score"
                    type="number"
                    min={1}
                    max={100}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                </div>
              )}
            />

            <DrawerFooter className="px-0 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={() => form.handleSubmit()}>
                {mode === 'add' ? '新增' : '保存'}
              </Button>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
