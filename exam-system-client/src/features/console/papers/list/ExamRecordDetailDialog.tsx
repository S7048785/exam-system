import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import { AlarmClock, GraduationCap, ListChecks, Target, Trophy } from 'lucide-react'
import { api } from '#/ApiInstance.ts'
import { formatDateTimeShort } from '#/lib/date-util.ts'
import { StatChip } from '#/features/exam/paper/components/StatChip.tsx'
import { QuestionCard } from '#/features/exam/paper/components/QuestionCard.tsx'
import { QuestionNavigator } from '#/features/exam/paper/components/QuestionNavigator.tsx'
import { orderQuestionsByType } from '#/features/exam/paper/utils.ts'
import { EXAM_RECORD_STATUS_MAP } from './examRecordConstants.ts'
import type { ExamRecordListItemRes } from '#/__generated/model/static'
import type { QuestionType } from '#/__generated/model/enums'
import type { AnswerMap } from '#/features/exam/paper/types.ts'

interface ExamRecordDetailDialogProps {
  /** 列表行数据：顶栏信息直接复用它（比详情接口多带及格分/排名），无需再查一次 */
  record: ExamRecordListItemRes | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** 题卡是只读的，交互回调给个空实现（外面又套了 `inert`，点不动） */
const noop = () => {}

/** 用时秒数 →「X分Y秒」 */
function formatUsedTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  return `${Math.floor(safe / 60)}分${safe % 60}秒`
}

/**
 * 判断题的历史数据里既有 `true/false`（现口径）也有 `T/F`（老数据），
 * 统一归一化后才能和 `optionsOf` 给出的 `true/false` 对上，否则老记录会渲染成「未作答」。
 */
function normalizeJudge(value?: string | null): 'true' | 'false' | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (v === 'true' || v === 't') return 'true'
  if (v === 'false' || v === 'f') return 'false'
  return undefined
}

/**
 * 把库里的 `userAnswer` 转成题卡要的 `value: string[]`。
 *
 * 🔴 口径必须与 `optionsOf` 产出的 `value` 对齐：选择题是**选项字母**（按 `sort` 排完序的下标），
 * 判断题是 `true`/`false` —— 直接拿原始 `userAnswer` 塞进去，判断题会永远显示未选。
 *
 * 题目已被删除的「孤儿答案」（其 `questionId` 不在本卷题目里）直接跳过。
 */
function answersOf(
  questions: ReadonlyArray<{ id: number; type: QuestionType }>,
  records: ReadonlyArray<{ questionId: number; userAnswer: string }>,
): AnswerMap {
  const typeById = new Map(questions.map((q) => [q.id, q.type]))
  const answers: AnswerMap = {}
  for (const record of records) {
    const type = typeById.get(record.questionId)
    if (type === undefined) continue
    if (type === 'MULTIPLE_CHOICE') {
      answers[record.questionId] = record.userAnswer
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    } else if (type === 'JUDGE') {
      const normalized = normalizeJudge(record.userAnswer)
      answers[record.questionId] = normalized ? [normalized] : []
    } else {
      answers[record.questionId] = [record.userAnswer]
    }
  }
  return answers
}

/** 标准答案文案：选择题显示字母、判断题显示「正确/错误」 */
function correctAnswerText(question: {
  type: QuestionType
  answer: string
}): string {
  if (question.type === 'JUDGE') {
    const normalized = normalizeJudge(question.answer)
    if (!normalized) return '—'
    return normalized === 'true' ? '正确' : '错误'
  }
  return question.answer ? question.answer.toUpperCase() : '—'
}

/**
 * 题卡下方贴着的一条「批改结果」。
 *
 * ⚠️ 题卡（答题页复用）不显示对错，所以得分与对错**一律取库里 `answer_record` 的值，前端不重算**
 * —— 历史数据里标准答案被改过（考生答 `T` 却得了满分），重算会自相矛盾。
 */
function ReviewBar({
  question,
  score,
  correct,
  answered,
 answer
}: {
  question: { id: number; type: QuestionType; score: number; }
  answer: string
  score?: number
  correct?: number
  answered: boolean
}) {
  // 简答题后端不自动判分；老数据里它的 score 是 0，直接显示会误导成「得了 0 分」
  if (question.type === 'TEXT') {
    return (
      <div className="bg-muted/40 flex flex-wrap items-center gap-2 border border-t-0 px-5 py-2.5 text-xs shadow-sm">
        <span className="text-muted-foreground">
          {answered ? '简答题由人工批改，不在此自动判分' : '未作答'}
        </span>
      </div>
    )
  }
  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-1 border border-t-0 px-5 py-2.5 text-xs shadow-sm">
      <span className="text-muted-foreground">
        标准答案：
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          {correctAnswerText({ type:question.type, answer: answer })}
        </span>
      </span>
      <span className="text-muted-foreground ml-auto">
        得分 <span className="text-foreground font-semibold">{score ?? 0}</span>{' '}
        / {question.score}
      </span>
      {!answered ? (
        <Badge variant="outline">未作答</Badge>
      ) : (
        <Badge variant={correct === 1 ? 'secondary' : 'destructive'}>
          {correct === 1 ? '答对' : '答错'}
        </Badge>
      )}
    </div>
  )
}

/**
 * 「成绩」列表行 → 该考生本次考试的**逐题作答详情**（只读）。
 *
 * 数据源 `GET /exams/records/{recordId}/detail`（控制台侧，后端按**试卷作者**校验归属，
 * 且与考生侧一样**拦 ONGOING** —— 所以列表里「考试中」的行按钮是禁用的）。
 *
 * 布局**1:1 复刻答题页**（`routes/_public/exam.paper.$paperId.tsx`）：
 * 顶栏（试卷名 + 考生 + 统计格）→ 左答题卡题号 → 右题目列表。
 * 三个组件都是只读引用答题页的：`StatChip`、`QuestionNavigator`、`QuestionCard`
 * （题卡外面套 `inert` 关掉交互），**没有改动考试模块的任何文件**。
 */
export default function ExamRecordDetailDialog({
  record,
  open,
  onOpenChange,
}: ExamRecordDetailDialogProps) {
  const recordId = record?.id

  const { data, isFetching, error } = useQuery({
    queryKey: ['examRecordDetail', recordId],
    queryFn: () => api.examController.getRecordDetail({ recordId: recordId! }),
    // 没有行数据就不发请求；「考试中」的行不会走到这里（按钮已禁用 + 后端也拦）
    enabled: open && !!recordId,
    staleTime: 30 * 1000,
  })
  const detail = data?.data

  const questions = detail?.paper.questions ?? []
  const answerRecords = detail?.answerRecords ?? []
  const ordered = orderQuestionsByType(questions)
  const answerMap = answersOf(questions, answerRecords)
  const answerByQuestion = new Map(
    answerRecords.map((answer) => [answer.questionId, answer]),
  )
  const questionById = new Map(questions.map((question) => [question.id, question]))

  /**
   * 左侧答题卡的着色依据（`questionId → 对/错`）。
   *
   * - 只收**客观题**：简答题后端不自动判分（老数据里 `correct` 是 0），参与着色会整片标红；
   * - 题目已删的孤儿答案跳过；
   * - `correct` 为 null 的（未批改）不下结论，格子保持中性。
   */
  const results: Record<number, 'correct' | 'wrong'> = {}
  for (const answer of answerRecords) {
    const question = questionById.get(answer.questionId)
    if (!question || question.type === 'TEXT') continue
    if (answer.correct === 1) {
      results[answer.questionId] = 'correct'
    } else if (answer.correct === 0) {
      results[answer.questionId] = 'wrong'
    }
  }

  /** 与答题页同一套跳题逻辑：题卡自带 `id="question-{id}"`，滚到最近的滚动祖先 */
  const jumpToQuestion = (questionId: number) => {
    document
      .getElementById(`question-${questionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const emptyText = error
    ? error instanceof Error
      ? error.message
      : '加载失败'
    : isFetching
      ? '加载中…'
      : '暂无作答记录'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] max-h-[88vh] w-[96%] max-w-7xl flex-col gap-0 overflow-hidden p-0">
        {/* 顶栏已把信息显示全了，标题只留给读屏 */}
        <DialogTitle className="sr-only">
          答题详情 · {record?.studentName ?? ''}
        </DialogTitle>
        <DialogDescription className="sr-only">
          查看该考生本次考试的逐题作答与得分
        </DialogDescription>

        {/* 顶栏：照答题页 ExamTopBar 的形态（左：试卷名 + 考生；右：一排统计格） */}
        <header className="bg-background/80 flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <GraduationCap className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {detail?.paper.name ?? ''}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                考生：{record?.studentName ?? ''}
                {record
                  ? ` · ${formatDateTimeShort(record.startTime)} ~ ${
                      record.endTime
                        ? formatDateTimeShort(record.endTime)
                        : '-'
                    }`
                  : ''}
              </div>
            </div>
          </div>

          {record ? (
            // pr-14 给弹窗右上角自带的关闭按钮让位
            <div className="flex shrink-0 items-center gap-2 pr-14">
              <Badge variant={EXAM_RECORD_STATUS_MAP[record.status].variant}>
                {EXAM_RECORD_STATUS_MAP[record.status].label}
              </Badge>
              <StatChip
                icon={<Trophy className="size-4" />}
                label="得分 / 总分"
                value={`${record.score} / ${record.totalScore}`}
                tone={record.score >= record.passingScore ? 'success' : 'default'}
              />
              <StatChip
                icon={<Target className="size-4" />}
                label="及格分"
                value={String(record.passingScore)}
              />
              <StatChip
                icon={<ListChecks className="size-4" />}
                label="排名"
                value={String(record.rank)}
              />
              <StatChip
                icon={<AlarmClock className="size-4" />}
                label="用时"
                value={formatUsedTime(record.usedSeconds)}
              />
            </div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1">
          {/* 左侧答题卡：原样复用，点题号可滚到对应题目；`results` 只在控制台传，按对错着色 */}
          <QuestionNavigator
            questions={questions}
            answers={answerMap}
            onJump={jumpToQuestion}
            results={results}
          />

          {/* 右侧题目列表：与答题页同宽（w-10/11）、同间距（space-y-5 p-6） */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="w-10/11 space-y-5 p-6">
              {ordered.length === 0 ? (
                <div className="text-muted-foreground py-10 text-center text-sm">
                  {emptyText}
                </div>
              ) : (
                ordered.map(({ no, question }) => {
                  const answer = answerByQuestion.get(question.id)
                  const answered = !!answer && answer.userAnswer.trim() !== ''
                  return (
                    <div key={question.id}>
                      {/* inert：只读复用答题页题卡，屏蔽点击与键盘聚焦（选项是真输入框） */}
                      <div inert={true}>
                        <QuestionCard
                          no={no}
                          question={question}
                          value={answerMap[question.id] ?? []}
                          onChange={noop}
                        />
                      </div>
                      <ReviewBar
                        question={question}
                        answer={answer?.userAnswer || ''}
                        score={answer?.score}
                        correct={answer?.correct}
                        answered={answered}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}
