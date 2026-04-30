import type {Status} from '#/__generated/model/enums/Status'
import {api} from '#/ApiInstance.ts'
import {queryOptions} from '@tanstack/react-query'

/**
 * 查询试卷列表
 */
export const paperListQueryOptions = (param: {
  name?: string
  status?: Status
}) =>
  queryOptions({
    queryKey: ['paperList'],
    queryFn: () =>
      api.paperController.listPapers({
        name: param.name,
        status: param.status,
      }),
  })
