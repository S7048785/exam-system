import {api} from '#/ApiInstance.ts'
import {queryOptions} from '@tanstack/react-query'
import type {PaperStatus} from '#/__generated/model/enums'

/**
 * 查询试卷列表
 */
export const paperListQueryOptions = (param: {
  name?: string
  status?: PaperStatus
}) =>
  queryOptions({
    queryKey: ['paperList'],
    queryFn: () =>
      api.paperController.listPapers({
        name: param.name,
        status: param.status,
      }),
  })
