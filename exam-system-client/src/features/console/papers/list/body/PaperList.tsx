import type { PaperDto } from '#/__generated/model/dto/PaperDto.ts'
import { useQueryClient } from '@tanstack/react-query'
import {
  useDeleteMutation,
  useUnpublishMutation,
} from '../../usePaperActions.ts'
import PaperRow from './PaperRow.tsx'

interface Props {
  papers: ReadonlyArray<PaperDto['PaperController/PAPER_ITEM']>
}
export default function PaperList({ papers }: Props) {
  const queryClient = useQueryClient()

  // 删除试卷
  const deleteMutation = useDeleteMutation()
  // 撤回发布（会连带删除该卷全部考试记录）
  const unpublishMutation = useUnpublishMutation()

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
    queryClient.invalidateQueries({
      queryKey: ['listPapers'],
    })
  }

  const handleUnpublish = (id: number) => {
    unpublishMutation.mutate(id)
  }

  return (
    <div className="flex flex-col gap-4">
      {papers.map((item) => (
        <PaperRow
          key={item.id}
          item={item}
          onDelete={handleDelete}
          onUnpublish={handleUnpublish}
        />
      ))}
    </div>
  )
}

