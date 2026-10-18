import { useQuery } from '@tanstack/react-query'
import { examRecordDetailQueryOptions } from '#/features/console/papers/paperQueries.ts'
import { deriveDetail } from './utils.ts'
import type { DetailDerivation } from './utils.ts'

/** `useScoreDetail` 的返回值：两个弹窗把它整体透传给 {@link ScoreDialogShell}，避免拆成一堆 props */
export interface ScoreDetailScope extends DetailDerivation {
  isFetching: boolean
  error: unknown
}

/**
 * 「成绩详情」与「考试评分」两个弹窗共用的取数 + 派生。
 *
 * 数据源 `GET /exams/records/{recordId}/detail`（控制台侧，后端按**试卷作者**校验归属，
 * 且与考生侧一样**拦 ONGOING** —— 所以列表里「考试中」的行按钮是禁用的）。
 * 派生口径见 {@link deriveDetail}，考生侧的「查看答案解析」弹窗共用同一份。
 */
export function useScoreDetail(
  recordId: string | undefined,
  enabled: boolean,
): ScoreDetailScope {
  const { data, isFetching, error } = useQuery({
    ...examRecordDetailQueryOptions(recordId!),
    // 没有行数据就不发请求；「考试中」的行不会走到这里（按钮已禁用 + 后端也拦）
    enabled: enabled && !!recordId,
  })

  return { ...deriveDetail(data?.data), isFetching, error }
}
