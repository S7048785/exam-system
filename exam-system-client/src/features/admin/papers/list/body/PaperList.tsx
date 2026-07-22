import type { PaperDto } from '#/__generated/model/dto/PaperDto.ts'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteMutation } from '../../usePaperActions'
import PaperRow from './PaperRow'

interface Props {
  papers: ReadonlyArray<PaperDto['PaperController/PAPER_ITEM']>
}
export default function PaperList({ papers }: Props) {
  const queryClient = useQueryClient()

  // 删除试卷
  const deleteMutation = useDeleteMutation()

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
    queryClient.invalidateQueries({
      queryKey: ['listPapers'],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {papers.map((item) => (
        <PaperRow key={item.id} item={item} onDelete={handleDelete} />
      ))}
    </div>
  )
}
