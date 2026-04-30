import {useEffect, useState} from 'react'
import {useForm} from '@tanstack/react-form'
import type {
	CategoriesTree,
	QuestionSaveInput,
	QuestionsPageView,
	QuestionUpdateInput,
} from '#/__generated/model/static'
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '#/components/ui/drawer'
import {Button} from '#/components/ui/button'
import {Input} from '#/components/ui/input'
import {Label} from '#/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '#/components/ui/select'
import {toast} from 'sonner'
import {useIsMobile} from '#/hooks/use-mobile.ts'
import ChoiceForm from './ChoiceForm'
import JudgeForm from './JudgeForm'
import TextForm from './TextForm'
import {flattenCategories} from '#/features/admin/questions/utils.ts'

// 题目类型
const QUESTION_TYPES = [
  { value: 'CHOICE', label: '选择题' },
  { value: 'JUDGE', label: '判断题' },
  { value: 'TEXT', label: '简答题' },
] as const

// 难度选项
const DIFFICULTIES = [
  { value: 'EASY', label: '简单' },
  { value: 'MEDIUM', label: '普通' },
  { value: 'HARD', label: '困难' },
] as const

interface QuestionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  question: QuestionsPageView | null
  onSubmit: (values: QuestionSaveInput | QuestionUpdateInput) => void
  categories: readonly CategoriesTree[]
}

// 题型类型
type QuestionType = (typeof QUESTION_TYPES)[number]['value']
// 难度类型
type Difficulty = (typeof DIFFICULTIES)[number]['value']

export default function QuestionDrawer({
  open,
  onOpenChange,
  mode,
  question,
  onSubmit,
  categories,
}: QuestionDrawerProps) {
  const isMobile = useIsMobile()

  const flatCategories = flattenCategories(categories)

  // 各题型特有数据
  const [choiceData, setChoiceData] = useState({
    multi: false,
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
      type: question?.type || 'CHOICE',
      title: question?.title || '',
      difficulty: question?.difficulty || ('MEDIUM' as Difficulty),
      score: question?.score || 5,
      multi: question?.multi || false,
      categoryId: question?.categoryId || undefined,
      analysis: question?.analysis || '',
      answers: question?.answers,
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
        type: value.type,
        difficulty: value.difficulty,
        score: value.score,
      }

      if (value.type === 'CHOICE') {
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

        const correctAnswers = filledChoices
          .map((c, i) => (c.correct ? String.fromCharCode(65 + i) : ''))
          .filter(Boolean)
          .join(',')

        const input: QuestionSaveInput | QuestionUpdateInput = {
          ...baseData,
          id: question?.id,
          multi: value.multi,
          categoryId: value.categoryId,
          analysis: value.analysis.trim() || undefined,
          choices: filledChoices.map((c, i) => ({
            content: c.content.trim(),
            correct: c.correct,
            sort: i,
          })),
          answers: { id: question?.answers?.id, answer: correctAnswers },
        }
        console.log('update', input)
        onSubmit(input)
      } else if (value.type === 'JUDGE') {
        if (!value.categoryId) {
          toast.error('请选择分类')
          return
        }
        const input: QuestionSaveInput | QuestionUpdateInput = {
          ...baseData,
          id: question?.id,
          categoryId: value.categoryId,
          analysis: value.analysis.trim() || undefined,
          answers: { id: question?.answers?.id, answer: judgeData.judgeAnswer },
        }
        onSubmit(input)
      } else {
        // TEXT
        const input: QuestionSaveInput | QuestionUpdateInput = {
          ...baseData,
          id: question?.id,
          categoryId: value.categoryId,
          answers: { id: question?.answers?.id, answer: textAnswer.trim() },
        }
        onSubmit(input)
      }
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
          score: question.score || 5,
          answers: question.answers,
          analysis: question.analysis || '',
          categoryId: question.categoryId || undefined,
          multi: question.multi || false,
        })
      } else {
        form.reset({
          type: 'CHOICE',
          title: '',
          difficulty: 'MEDIUM',
          score: 1,
          analysis: '',
          answers: undefined,
          categoryId: undefined,
          multi: false,
        })
        setChoiceData({
          multi: false,
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
                    <p className="text-xs text-muted-foreground">
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
                  {type === 'CHOICE' && (
                    <ChoiceForm
                      value={choiceData}
                      onChange={setChoiceData}
                      editData={mode === 'edit' ? question : null}
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
