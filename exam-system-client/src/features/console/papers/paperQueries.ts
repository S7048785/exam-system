import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type {
  ExamRecordListQuery,
  PaperAiSaveDto,
  PaperListQuery,
  QuestionListReq,
} from '#/__generated/model/static'

export const papersQueryOptions = (filters: PaperListQuery) =>
  queryOptions({
    queryKey: ['listPapers', filters],
    queryFn: () => api.paperController.listPapers({ query: filters }),
    staleTime: 30 * 1000,
  })

export const paperDetailQueryOptions = (id: number, enabled: boolean) =>
  queryOptions({
    queryKey: ['paperDetail', id],
    queryFn: () => api.paperController.getPaper({ id }),
    staleTime: 30 * 1000,
    enabled,
  })

export const paperQueries = {
  list: papersQueryOptions,
  detail: paperDetailQueryOptions,
  remove: (id: number) => api.paperController.removePaper({ id }),
  aiGenerate: (input: PaperAiSaveDto) =>
    api.paperController.aiPaper({ body: input }),
}

/** 试卷题目（「设计试卷」那一步）；写操作 hook 会失效 `['paper-questions', paperId]` */
export const paperQuestionsQueryOptions = (paperId: number) =>
  queryOptions({
    queryKey: ['paper-questions', paperId],
    queryFn: () => api.paperController.getPaperQuestions({ id: paperId }),
    select: (d) => d.data,
  })

/** 建卷向导第 0 步的试卷分类树（静态数据，命中缓存） */
export const paperCategoryTreeQueryOptions = queryOptions({
  queryKey: ['paper-category-tree'],
  queryFn: () => api.paperCategoryController.tree(),
})

/** 从题库选题的分页查询；`req` 里已把 UI 的「ALL」收敛成 undefined */
export const bankQuestionsQueryOptions = (
  req: QuestionListReq,
  enabled: boolean,
) =>
  queryOptions({
    queryKey: ['bank-questions', req],
    queryFn: () => api.questionController.listQuestions({ req }),
    staleTime: 0,
    enabled,
    select: (d) => d.data,
  })

/** 某份试卷的考试记录（成绩列表）；姓名里的空白已收敛成 undefined */
export const paperExamRecordsQueryOptions = (
  query: ExamRecordListQuery,
  enabled: boolean,
) =>
  queryOptions({
    queryKey: [
      'paperExamRecords',
      query.paperId,
      query.page,
      query.size,
      query.name,
      query.status,
      query.passed,
    ],
    queryFn: () => api.examController.listPaperRecords({ query }),
    enabled,
    // 翻页 / 改名时保留上一页内容，避免表格闪一下空白
    placeholderData: (prev) => prev,
    staleTime: 10 * 1000,
  })

/** 整卷统计（不受姓名 / 状态 / 及格筛选影响，也与分页无关，故单独一个 key） */
export const paperExamStatsQueryOptions = (paperId: number, enabled: boolean) =>
  queryOptions({
    queryKey: ['paperExamStats', paperId],
    queryFn: () =>
      api.examController.getExamRecordStats({ query: { paperId } }),
    enabled,
    staleTime: 10 * 1000,
  })

/** 单条考试记录的答题详情（成绩详情 / 考试评分两个弹窗共用；按 `publicId` 定位） */
export const examRecordDetailQueryOptions = (recordId: string) =>
  queryOptions({
    queryKey: ['examRecordDetail', recordId],
    queryFn: () => api.examController.getRecordDetail({ publicId: recordId }),
    staleTime: 30 * 1000,
  })
