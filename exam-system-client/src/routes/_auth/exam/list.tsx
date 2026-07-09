import z from 'zod'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui'
import ExamPaperList from '#/features/exam/list/components/ExamPaperList.tsx'
import { paperListQueryOptions } from '#/features/exam/list/examQueries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { PAPER_STATUS } from '#/features/admin/papers/constants.ts'
import type { PaperDto } from '#/__generated/model/dto'
import { ExamStartDialog } from '#/features/exam/list/components/ExamStartDialog.tsx'

export const Route = createFileRoute('/_auth/exam/list')({
  component: ExamListPage,
  validateSearch: z.object({
    keyword: z.string().optional(),
  }),
  loaderDeps: ({ search: { keyword } }) => ({ keyword }),
  loader: async ({ context, deps: { keyword } }) => {
    return context.queryClient.fetchQuery(
      paperListQueryOptions({
        status: PAPER_STATUS.PUBLISHED,
        name: keyword,
      }),
    )
  },
})

function ExamListPage() {
  const { history, navigate } = useRouter()
  const { keyword } = Route.useSearch()
  const { data } = useSuspenseQuery(
    paperListQueryOptions({
      status: PAPER_STATUS.PUBLISHED,
      name: keyword,
    }),
  )

  const ref = useRef<HTMLInputElement>(null)

  const onSearch = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const inputValue = ref.current?.value
    navigate({ to: '/exam/list', search: { keyword: inputValue } })
  }

  const [selectedPaper, setSelectedPaper] = useState<
    PaperDto['PaperController/PAPER_ITEM'] | null
  >(null)

  const toggleDialog = (index: number | null) => {
    if (index == null) {
      setSelectedPaper(null)
      return
    }
    setSelectedPaper(data.data[index])
  }
  const closeDialog = () => {
    toggleDialog(null)
  }
  return (
    <div className="mx-4 space-y-8 pt-10 md:mx-auto md:w-[80vw]">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowLeftIcon className="rtl:rotate-180" data-icon="inline-end" />{' '}
          返回
        </Button>
        <span className="text-foreground/80">|</span>
        <span className="text-lg">选择试卷开始考试</span>
      </div>
      <form onSubmit={onSearch} className="flex gap-2 md:mx-auto md:w-[80%]">
        <Input
          ref={ref}
          defaultValue={keyword}
          name="keyword"
          type="search"
          placeholder="Search..."
        />
        <Button>Search</Button>
      </form>
      <ExamPaperList data={data.data} onOpenChange={toggleDialog} />
      <ExamStartDialog
        open={selectedPaper !== null}
        data={selectedPaper}
        onClose={closeDialog}
        onExamStart={() => {
          // 开始考试
        }}
      />
    </div>
  )
}
