import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import z from 'zod'
import { Button } from '#/components/ui/button.tsx'
import { ExamTopBar } from '#/features/exam/paper/components/ExamTopBar.tsx'
import { QuestionCard } from '#/features/exam/paper/components/QuestionCard.tsx'
import { QuestionNavigator } from '#/features/exam/paper/components/QuestionNavigator.tsx'
import {
  examTakingQueryOptions,
  saveExamAnswers,
  submitExamAnswers,
} from '#/features/exam/paper/examQueries.ts'
import { useCountdown } from '#/features/exam/paper/useCountdown.ts'
import {
  answerRecordsToMap,
  countAnswered,
  formatCountdown,
  orderQuestionsByType,
  toSubmitAnswers,
} from '#/features/exam/paper/utils.ts'
import type {
  ExamTakingView,
  SubmitAnswerReq,
} from '#/__generated/model/static'
import type { AnswerMap } from '#/features/exam/paper/types.ts'

/**
 * 答题页 `/exam/paper/{paperId}?recordId={考试记录 id}`（免登录可访问）。
 *
 * 流程：入口页点「开始考试 / 继续考试」→ `POST /exams/start` 拿到考试记录 id（雪花，**字符串**）
 * → 带在 `?recordId=` 跳到本页 → `GET /exams/{recordId}/taking` 取题目。
 *
 * 动作按钮是**先存后交**：未保存 → `POST /exams/{recordId}/answers`；已保存 → `POST /exams/submit/{recordId}`。
 * 后端交卷时**不落库答案**，是按已保存的答案批改的，所以这个顺序不能省。
 */
export const Route = createFileRoute('/_public/exam/paper/$paperId')({
  validateSearch: z.object({ recordId: z.string().optional() }),
  loaderDeps: ({ search }) => ({ recordId: search.recordId }),
  loader: async ({ context, deps }) => {
    if (!deps.recordId) return
    // 用 prefetchQuery 而不是 ensureQueryData：记录查不到（422「考试记录不存在」等）时不该把整页
    // 推进 errorComponent —— 页面里有自己的「无法进入考试」兜底，预取失败就交给它。
    await context.queryClient.prefetchQuery(
      examTakingQueryOptions(deps.recordId),
    )
  },
  component: ExamTakingPage,
})

/** 剩余时间不足这个数就标红提醒 */
const URGENT_THRESHOLD_MS = 5 * 60_000

/** `ApiError.message` 就是后端的业务文案（422 是 text/plain，5xx 也有），拿不到才用 fallback */
const errorText = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

function ExamTakingPage() {
  // 记录 id 由入口页带过来；没有说明不是从入口进的（直接开 URL），不放行
  const { recordId } = Route.useSearch()
  if (!recordId) {
    return (
      <ExamNotice
        title="缺少考试记录"
        description="请从考试入口点击「开始考试」进入答题页。"
      />
    )
  }
  return <ExamPaper recordId={recordId} />
}

/** 取数层：只负责把 `ExamTakingView` 拿到手，交给下面的答题组件渲染 */
function ExamPaper({ recordId }: { recordId: string }) {
  const { data, isPending, error } = useQuery(examTakingQueryOptions(recordId))

  if (isPending) {
    return (
      <div className="bg-background text-muted-foreground flex h-screen items-center justify-center text-sm">
        正在加载试卷…
      </div>
    )
  }
  if (error || !data) {
    return (
      <ExamNotice
        title="无法进入考试"
        description={errorText(error, '试卷加载失败，请稍后重试。')}
      />
    )
  }
  if (data.status !== 'ONGOING') {
    return (
      <ExamNotice
        title="该场考试已结束"
        description="这份试卷已经提交，不能再作答。"
      />
    )
  }
  return <ExamTaking exam={data} recordId={recordId} />
}

/**
 * 答题主体。
 *
 * 单独拆一层是为了让 `exam` 拿到之后**所有 hooks 无条件执行** —— 上面取数层的早返回
 * （加载中 / 报错 / 已交卷）不会打断 hooks 的调用顺序。
 */
function ExamTaking({
  exam,
  recordId,
}: {
  exam: ExamTakingView
  recordId: string
}) {
  const { paperId } = Route.useParams()
  const navigate = useNavigate()

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

  const saveMutation = useMutation({
    mutationFn: (body: SubmitAnswerReq[]) => saveExamAnswers(recordId, body),
    onSuccess: () => {
      setSaved(true)
      toast.success('答案已保存')
    },
    onError: (err) => toast.error(errorText(err, '保存失败，请稍后重试')),
  })

  const submitMutation = useMutation({
    mutationFn: (body: SubmitAnswerReq[]) => submitExamAnswers(recordId, body),
    onSuccess: async () => {
      toast.success('试卷已提交')
      // 交完卷回入口页，那边会按最新的考试记录重新判断状态
      await navigate({ to: '/exam/$paperId', params: { paperId } })
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

  const jumpToQuestion = (questionId: number) => {
    document
      .getElementById(`question-${questionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

/** 兜底页：缺记录 / 加载失败 / 已交卷，统一说明 + 一个回入口的出口 */
function ExamNotice({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { paperId } = Route.useParams()

  return (
    <div className="bg-background flex h-screen items-center justify-center p-6">
      <div className="bg-card w-full max-w-md space-y-4 border p-8 text-center shadow-xl">
        <div className="text-lg font-semibold">{title}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
        <Button className="w-full" asChild>
          <Link to="/exam/$paperId" params={{ paperId }}>
            返回考试入口
          </Link>
        </Button>
      </div>
    </div>
  )
}
