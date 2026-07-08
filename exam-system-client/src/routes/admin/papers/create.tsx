import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { PaperSaveInput } from '#/__generated/model/static'
import { paperQueries } from '#/features/admin/papers/paperQueries.ts'
import PaperForm from '#/features/admin/papers/components/PaperForm.tsx'

export const Route = createFileRoute('/admin/papers/create')({
  component: CreatePaperPage,
})

function CreatePaperPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: (data: PaperSaveInput) => paperQueries.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['papers'] })
      toast.success('试卷创建成功')
      navigate({ to: '/admin/papers/list' })
    },
    onError: () => {
      toast.error('创建失败')
    },
  })

  return (
    <PaperForm
      initialValues={{
        name: '',
        description: '',
        duration: 60,
        questions: new Map(),
      }}
      isEdit={false}
      onSave={(data) => saveMutation.mutate(data as PaperSaveInput)}
      onCancel={() => navigate({ to: '/admin/papers/list' })}
    />
  )
}
