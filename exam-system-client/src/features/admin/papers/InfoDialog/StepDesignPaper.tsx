import { useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { toast } from 'sonner'
import { api } from '#/ApiInstance.ts'
import { cn } from '#/lib/utils.ts'
import { QUESTION_TYPE_MAP } from '#/features/admin/papers/constants.ts'
import CreateQuestionInPaperDialog from './CreateQuestionInPaperDialog.tsx'
import SelectQuestionFromBankDialog from './SelectQuestionFromBankDialog.tsx'
import type { PaperDetail_TargetOf_questions } from '#/__generated/model/static'

interface QuestionItem {
  id: number
  title: string
  type: string
  choices?: Array<{ content: string; correct?: boolean }>
  answer?: string
  score: number
}

interface StepDesignPaperProps {
  paperId: number
  onPublish: () => void
  isPublishing: boolean
}

/**
 * 设计试卷
 */
export default function StepDesignPaper({
  paperId,
  onPublish,
  isPublishing,
}: StepDesignPaperProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBankDialog, setShowBankDialog] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | undefined>()
  const tableBodyRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  const { data: questionsData, refetch: refetchQuestions } = useQuery({
    queryKey: ['paper-questions', paperId],
    queryFn: () => api.paperController.getPaperQuestions({ id: paperId }),
  })
  const questions = questionsData?.data || []
  const totalCount = questions.length
  const totalScore = questions.reduce((s, q) => s + q.score, 0)

  rowRefs.current = rowRefs.current.slice(0, questions.length)

  const removeQuestionMutation = useMutation({
    mutationFn: (questionId: number) =>
      api.paperController.removePaperQuestion({
        id: paperId,
        questionId,
      }),
    onSuccess: () => {
      refetchQuestions()
      toast.success('题目已移除')
    },
    onError: () => toast.error('移除失败'),
  })

  const updateScoreMutation = useMutation({
    mutationFn: ({
      questionId,
      score,
    }: {
      questionId: number
      score: number
    }) =>
      api.paperController.updatePaperQuestionScore({
        id: paperId,
        questionId,
        score,
      }),
    onSuccess: () => refetchQuestions(),
  })

  const scrollToQuestion = (index: number) => {
    setActiveIndex(index)
    const row = rowRefs.current[index]
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleScoreBlur = (
    questionId: number,
    e: React.FocusEvent<HTMLInputElement>,
  ) => {
    const newScore = Number(e.target.value)
    if (Number.isNaN(newScore) || newScore < 0) return
    updateScoreMutation.mutate({ questionId, score: newScore })
  }

  const handleDeleteQuestion = (questionId: number) => {
    removeQuestionMutation.mutate(questionId)
  }

  const getTypeLabel = (type: string) => {
    const entry = QUESTION_TYPE_MAP[type]
    return entry.label
  }

  const renderAnswer = (q: QuestionItem | PaperDetail_TargetOf_questions) => {
    if (q.type === 'CHOICE' && q.choices) {
      const correct = q.choices.filter((c) => c.correct)
      if (correct.length > 0) {
        return String(correct.map((c) => q.choices!.indexOf(c) + 1).join(', '))
      }
      return q.answer ?? ''
    }
    if (q.type === 'JUDGE') {
      return q.answer === 'true' || q.answer === 'T' ? '对' : '错'
    }
    return q.answer ?? ''
  }

  return (
    <div className="">
      <div className="grid grid-cols-[2fr_8fr] gap-4">
        {/* 左侧：总览 + 题号列表 */}
        <div className="bg-popover flex w-full shrink-0 flex-col rounded-lg">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <div className="text-muted-foreground text-xs">总计</div>
            <div className="text-lg font-semibold">
              {totalCount}
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                题
              </span>
            </div>
            <div className="text-lg font-semibold">
              {totalScore}
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                分
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {totalCount === 0 ? (
              <p className="text-muted-foreground pt-8 text-center text-sm">
                暂无题目
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => scrollToQuestion(i)}
                    className={cn(
                      'flex size-12 items-center justify-center rounded text-sm font-medium transition-colors',
                      activeIndex === i
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted-foreground/20',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：题目表格 */}
        <div className="bg-popover flex flex-col rounded-lg">
          <div ref={tableBodyRef} className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="w-14 px-3 py-2 font-medium">序号</th>
                  <th className="w-20 px-3 py-2 font-medium">题型</th>
                  <th className="px-3 py-2 font-medium">试题内容</th>
                  <th className="w-28 px-3 py-2 font-medium">标准答案</th>
                  <th className="w-24 px-3 py-2 font-medium">分数</th>
                  <th className="w-16 px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr
                    key={q.id}
                    ref={(el) => {
                      rowRefs.current[i] = el
                    }}
                    className={cn(
                      'border-t transition-colors',
                      activeIndex === i ? 'bg-primary/5' : 'hover:bg-muted/30',
                    )}
                  >
                    <td className="px-3 py-2 text-center">{i + 1}</td>
                    <td className="px-3 py-2">{getTypeLabel(q.type)}</td>
                    <td className="max-w-xs truncate px-3 py-2">{q.title}</td>
                    <td className="max-w-[120px] truncate px-3 py-2">
                      {renderAnswer(q)}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        defaultValue={q.score}
                        className="h-8 w-20"
                        onBlur={(e) => handleScoreBlur(q.id, e)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-7 px-1"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        删除
                      </Button>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground py-12 text-center"
                    >
                      暂未添加题目，请点击下方按钮添加
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 按钮组 */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                新增试题
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBankDialog(true)}
              >
                从题库中选题
              </Button>
            </div>
            <Button size="sm" onClick={onPublish} disabled={isPublishing}>
              {isPublishing ? '发布中...' : '发布'}
            </Button>
          </div>
        </div>
      </div>

      {/* 子 Dialog */}
      <CreateQuestionInPaperDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        paperId={paperId}
        onSuccess={refetchQuestions}
      />
      <SelectQuestionFromBankDialog
        open={showBankDialog}
        onOpenChange={setShowBankDialog}
        paperId={paperId}
        onSuccess={refetchQuestions}
        existingIds={questions.map((q) => q.id)}
      />
    </div>
  )
}
