import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExamTopBar } from '#/features/exam/taking/components/ExamTopBar.tsx'
import { QuestionCard } from '#/features/exam/taking/components/QuestionCard.tsx'
import { QuestionNavigator } from '#/features/exam/taking/components/QuestionNavigator.tsx'
import {
  answerRecordsToMap,
  countAnswered,
  errorText,
  formatCountdown,
  jumpToQuestion,
  orderQuestionsByType,
  toSubmitAnswers,
  useCountdown,
} from '#/features/exam/taking/utils.ts'
import type { AnswerMap } from '#/features/exam/taking/types.ts'
import type { ExamTakingView } from '#/__generated/model/static'
import { examResultQueryOptions } from '#/features/exam/examQueries.ts'
import {
  useSaveAnswersMutation,
  useSubmitExamMutation,
} from '#/features/exam/useExamActions.ts'

/** 剩余时间不足这个数就标红提醒 */
const URGENT_THRESHOLD_MS = 5 * 60_000

/**
 * 答题主体。
 *
 * 单独拆一层是为了让 `exam` 拿到之后**所有 hooks 无条件执行** —— 上面取数层的早返回
 * （加载中 / 报错 / 已交卷）不会打断 hooks 的调用顺序。
 */
export function ExamTaking({
  exam,
  recordId,
  paperId,
}: {
  exam: ExamTakingView
  recordId: string
  paperId: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const paper = exam.paper
  const questions = paper.questions

  // 「继续考试」：用后端带回来的 answerRecords 把上次的勾选状态恢复出来
  const [answers, setAnswers] = useState<AnswerMap>(() =>
    answerRecordsToMap(questions, exam.answerRecords),
  )
  // 答案是否已保存：动作按钮「保存试卷 → 提交试卷」靠它切换。
  // 刚进来时库里已有答案（恢复出来的就是库里那份）⇒ 算「已保存」；之后任何一次作答改动都重置回
  // false，逼考生先存再交。
  const [saved, setSaved] = useState(exam.answerRecords.length > 0)

  // 交卷时限 = 记录开始时间 + 单场作答时长（整场窗口的 `end` 由入口页 / 后端把关）
  const deadline =
    new Date(exam.startTime).getTime() + paper.examSettings.duration * 60_000
  const remaining = useCountdown(deadline)

  // 接口绑定在 `features/exam/useExamActions.ts`，副作用写在这里
  const saveMutation = useSaveAnswersMutation(recordId, {
    onSuccess: () => {
      setSaved(true)
      toast.success('答案已保存')
    },
    onError: (err) => toast.error(errorText(err, '保存失败，请稍后重试')),
  })

  const submitMutation = useSubmitExamMutation(recordId, {
    onSuccess: async () => {
      toast.success('试卷已提交')
      // 成绩页需要 GRADED 才给看。**没有已作答的简答题时，交卷当场就是 GRADED**
      // （后端 autoGradeAndFinish 按「答案行里有没有 TEXT 题」判断，不是按卷面有没有简答），
      // 所以先探一下结果接口：拿得到就进成绩页，还会顺带把结果缓存预热；
      // 含待人工批改的简答 ⇒ 422「试卷未提交」，回入口页等老师批改。
      try {
        await queryClient.fetchQuery(examResultQueryOptions(recordId))
        await navigate({
          to: '/exam/result/$publicId',
          params: { publicId: recordId },
        })
      } catch {
        await navigate({ to: '/exam/$paperId/start', params: { paperId } })
      }
    },
    onError: (err) => toast.error(errorText(err, '提交失败，请稍后重试')),
  })

  const urgent = remaining !== null && remaining <= URGENT_THRESHOLD_MS
  const countdownText =
    remaining === null ? '--:--' : formatCountdown(remaining)
  const answeredCount = countAnswered(questions, answers)
  // 题目按「单选 → 判断 → 多选 → 简答」分组排序；题号在这里一次算好，题目列表和左侧答题卡共用
  const orderedQuestions = orderQuestionsByType(questions)
  const busy = saveMutation.isPending || submitMutation.isPending

  const updateAnswer = (questionId: number, next: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: next }))
    // 一改动就回到「未保存」
    setSaved(false)
  }

  /**
   * 顶栏那个唯一的动作按钮：**先存后交**。
   *
   * - 未保存 → 保存答案（存完按钮变「提交试卷」）
   * - 已保存 → 交卷（后端按已保存的答案批改）
   */
  const handleAction = () => {
    const body = toSubmitAnswers(questions, answers)
    if (!saved) {
      saveMutation.mutate(body)
      return
    }
    submitMutation.mutate(body)
  }

  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <ExamTopBar
        paperName={paper.name}
        studentName={exam.studentName}
        countdownText={countdownText}
        urgent={urgent}
        totalCount={questions.length}
        answeredCount={answeredCount}
        saved={saved}
        busy={busy}
        onAction={handleAction}
      />

      <div className="flex min-h-0 flex-1">
        <div className="shrink-0 overflow-y-auto">
          <QuestionNavigator
            questions={questions}
            answers={answers}
            onJump={jumpToQuestion}
          />
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="w-10/11 space-y-5 p-6">
            {orderedQuestions.map(({ no, question }) => (
              <QuestionCard
                key={question.id}
                no={no}
                question={question}
                value={answers[question.id] ?? []}
                onChange={(next) => updateAnswer(question.id, next)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
