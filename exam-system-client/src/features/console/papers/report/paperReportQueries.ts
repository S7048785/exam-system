import { queryOptions } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import type { PaperReportListQuery } from '#/__generated/model/static'

/**
 * 「人工判卷」页的列表查询（控制台）。
 *
 * 接口是 `GET /paper/report/list`，返回 **`PageRes<PaperReportView>`（不套 `R`）**
 * —— 所以拿到的是 `{ total, page, pageSize, list }` 本身，不是 `{ data }`，取值时别多套一层。
 */
export const paperReportsQueryOptions = (filters: PaperReportListQuery) =>
  queryOptions({
    queryKey: ['listPaperReports', filters],
    queryFn: () => api.paperController.listPaperReports({ query: filters }),
    staleTime: 30 * 1000,
  })
