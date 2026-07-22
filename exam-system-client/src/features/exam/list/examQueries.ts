import { api } from '#/ApiInstance.ts'
import { queryOptions } from '@tanstack/react-query'

/**
 * 查询试卷列表
 */
export const paperListQueryOptions = (param: {
  name: string
  ongoing?: boolean
}) =>
  queryOptions({
    queryKey: ['paperList', param],
    queryFn: () =>
      api.paperController.listPapers({
        query: {
          name: param.name,
          ongoing: param.ongoing,
        },
      }),
    select: (data) => data.data,
  })
