import type {PaperDto} from '#/__generated/model/dto'
import {Button} from '#/components/ui/button.tsx'
import {Input} from '#/components/ui/input.tsx'
import ExamPaperList from '#/features/exam/list/components/ExamPaperList.tsx'
import {paperListQueryOptions} from '#/features/exam/list/examQueries.ts'
import {useSuspenseQuery} from '@tanstack/react-query'
import {getRouteApi, useRouter} from '@tanstack/react-router'
import {ArrowLeftIcon} from 'lucide-react'
import {useRef, useState} from 'react'
import {ExamStartDialog} from './components/ExamStartDialog'
import {PAPER_STATUS} from "#/features/admin/papers/utils.ts";

const routeApi = getRouteApi('/exam/list')

export default function ExamListPage() {
  const { keyword } = routeApi.useSearch()
  const { data } = useSuspenseQuery(
    paperListQueryOptions({
      status: PAPER_STATUS.PUBLISHED,
      name: keyword,
    }),
  )
  const { history, navigate } = useRouter()

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
    setSelectedPaper(data.data![index])
  }
  const closeDialog = () => {
    toggleDialog(null)
  }
  return (
    <div className="md:w-[80vw] pt-10 md:mx-auto mx-4 space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowLeftIcon className="rtl:rotate-180" data-icon="inline-end" />{' '}
          返回
        </Button>
        <span className="text-foreground/80">|</span>
        <span className="text-lg">选择试卷开始考试</span>
      </div>
      <form onSubmit={onSearch} className="flex gap-2 md:w-[80%] md:mx-auto">
        <Input
          ref={ref}
          defaultValue={keyword}
          name="keyword"
          type="search"
          placeholder="Search..."
        />
        <Button>Search</Button>
      </form>
      <ExamPaperList data={data.data || []} onOpenChange={toggleDialog} />
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
