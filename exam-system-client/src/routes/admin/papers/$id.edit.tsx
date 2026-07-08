import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { PaperUpdateInput } from '#/__generated/model/static'
import {
  paperDetailQueryOptions,
  paperQueries,
} from '#/features/admin/papers/paperQueries.ts'
import PaperForm from '#/features/admin/papers/components/PaperForm.tsx'

export const Route = createFileRoute('/admin/papers/$id/edit')({
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      paperDetailQueryOptions(Number(params.id)),
    )
  },
  component: EditPaperPage,
})

export default function EditPaperPage() {
  const { id } = useParams({ strict: false })
  const paperId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: paperDetail } = useSuspenseQuery(
    paperDetailQueryOptions(paperId),
  )

  const saveMutation = useMutation({
    mutationFn: (data: PaperUpdateInput) => paperQueries.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] })
      toast.success('试卷更新成功')
      navigate({ to: '/admin/papers/list' })
    },
    onError: () => {
      toast.error('更新失败')
    },
  })

  const questions = new Map(
    paperDetail.data.questions.map((q: any) => [q.id, { score: q.score ?? 5 }]),
  )

  return (
    <PaperForm
      initialValues={{
        name: paperDetail.data.name,
        description: paperDetail.data.description,
        duration: paperDetail.data.duration,
        questions,
      }}
      isEdit
      onSave={(data) => saveMutation.mutate(data as PaperUpdateInput)}
      onCancel={() => navigate({ to: '/admin/papers/list' })}
    />
  )
}
