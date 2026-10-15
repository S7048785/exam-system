import { useQuery } from '@tanstack/react-query'
import { ExamNotice } from '#/features/exam/paper/ExamNotice.tsx'
import { ExamTaking } from '#/features/exam/paper/ExamTaking.tsx'
import { errorText } from '#/features/exam/paper/utils.ts'
import { examTakingQueryOptions } from '#/features/exam/examQueries.ts'

/** 取数层：只负责把 `ExamTakingView` 拿到手，交给下面的答题组件渲染 */
export function ExamPaper({
  recordId,
  paperId,
}: {
  recordId: string
  paperId: string
}) {
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
        paperId={paperId}
        title="无法进入考试"
        description={errorText(error, '试卷加载失败，请稍后重试。')}
      />
    )
  }
  if (data.status !== 'ONGOING') {
    return (
      <ExamNotice
        paperId={paperId}
        title="该场考试已结束"
        description="这份试卷已经提交，不能再作答。"
      />
    )
  }
  return <ExamTaking exam={data} recordId={recordId} paperId={paperId} />
}
