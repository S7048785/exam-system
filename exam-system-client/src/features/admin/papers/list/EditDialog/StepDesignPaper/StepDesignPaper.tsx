import {useRef, useState} from 'react'
import {useMutation, useQuery} from '@tanstack/react-query'
import {Button} from '#/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx'
import {ChevronDown} from 'lucide-react'
import {toast} from 'sonner'
import {api} from '#/ApiInstance.ts'
import {cn} from '#/lib/utils.ts'
import CreateQuestionInPaperDialog from './CreateQuestionInPaperDialog.tsx'
import SelectQuestionFromBankDialog from './SelectQuestionFromBankDialog.tsx'
import MemoTable from "#/features/admin/papers/list/EditDialog/StepDesignPaper/MemoTable.tsx";

interface StepDesignPaperProps {
	paperId: number
}


export default function StepDesignPaper({paperId}: StepDesignPaperProps) {
	const [createConfig, setCreateConfig] = useState<{
		type: 'CHOICE' | 'JUDGE' | 'TEXT'
	} | null>(null)
	const [showBankDialog, setShowBankDialog] = useState(false)
	const [activeIndex, setActiveIndex] = useState<number | undefined>()
	const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

	const {data: questionsData, refetch: refetchQuestions} = useQuery({
		queryKey: ['paper-questions', paperId],
		queryFn: () => api.paperController.getPaperQuestions({id: paperId}),
		select: (d) => d.data,
	})
	const questions = questionsData ?? []
	const totalCount = questions.length
	const totalScore = questions.reduce((s, q) => s + q.score, 0)

	const removeQuestionMutation = useMutation({
		mutationFn: (questionId: number) =>
				api.paperController.removePaperQuestion({
					id: paperId,
					questionId,
				}),
		onSuccess: async () => {
			await refetchQuestions()
			toast.success('题目已移除')
		},
		onError: () => toast.error('移除失败'),
	})

	const updateScoreMutation = useMutation({
		mutationFn: ({
									 questionId,
									 score,
								 }: {
			questionId: number
			score: number
		}) =>
				api.paperController.updatePaperQuestionScore({
					id: paperId,
					questionId,
					score,
				}),
		onSuccess: () => refetchQuestions(),
	})

	const handleUpdateScore = (id: number, score: string) => {
		const newScore = Number(score)
		if (Number.isNaN(newScore) || newScore < 0) return
		updateScoreMutation.mutate({questionId: id, score: newScore})
	}

	const handleDeleteQuestion = (id: number) => {
		removeQuestionMutation.mutate(id)
	}

	const scrollToQuestion = (index: number) => {
		setActiveIndex(index)
		const row = rowRefs.current[index]
		if (row) {
			row.scrollIntoView({behavior: 'smooth', block: 'center'})
		}
	}

	return (
			<div className="h-full">
				<div className="flex h-full gap-4">
					{/* 左侧：总览 + 题号列表 */}
					<div className="bg-popover flex shrink-0 flex-col rounded-lg">
						<div className="flex items-center gap-2 border-b px-4 py-3">
							<div className="text-muted-foreground text-xs">总计</div>
							<div className="text-lg font-semibold">
								{totalCount}
								<span className="text-muted-foreground ml-1 text-xs font-normal">
                题
              </span>
							</div>
							<div className="text-lg font-semibold">
								{totalScore}
								<span className="text-muted-foreground ml-1 text-xs font-normal">
                分
              </span>
							</div>
						</div>
						<div className="overflow-y-auto p-3">
							{totalCount === 0 ? (
									<p className="text-muted-foreground pt-8 text-center text-sm">
										暂无题目
									</p>
							) : (
									<div className="grid grid-cols-5 gap-2">
										{questions.map((q, i) => (
												<button
														key={q.id}
														type="button"
														onClick={() => scrollToQuestion(i)}
														className={cn(
																'flex size-10 items-center justify-center rounded text-sm font-medium transition-colors border ',
																activeIndex === i
																		? 'bg-primary text-primary-foreground'
																		: 'bg-muted hover:bg-muted/70',
														)}
												>
													{i + 1}
												</button>
										))}
									</div>
							)}
						</div>
					</div>

					{/* 右侧：题目表格 + 按钮组 */}
					<div className="bg-popover flex min-w-0 flex-4 flex-col rounded-lg">
						<div className="min-h-0 flex-1 overflow-auto">
							<MemoTable
									questions={questions}
									activeIndex={activeIndex}
									rowRefs={rowRefs}
									onScoreBlur={handleUpdateScore}
									onDelete={handleDeleteQuestion}
							/>
						</div>

						{/* 按钮组 — shrink-0 不随表格滚动 */}
						<div className="flex shrink-0 items-center justify-between border-t px-4 py-3">
							<div className="flex gap-2">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm" className="gap-1">
											新增试题
											<ChevronDown className="h-3 w-3"/>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										<DropdownMenuItem
												onClick={() => setCreateConfig({type: 'CHOICE'})}
										>
											选择题
										</DropdownMenuItem>
										<DropdownMenuItem
												onClick={() => setCreateConfig({type: 'JUDGE'})}
										>
											判断题
										</DropdownMenuItem>
										<DropdownMenuItem
												onClick={() => setCreateConfig({type: 'TEXT'})}
										>
											简答题
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
								<Button
										variant="outline"
										size="sm"
										onClick={() => setShowBankDialog(true)}
								>
									从题库中选题
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* 子 Dialog */}
				{createConfig && (
						<CreateQuestionInPaperDialog
								open={!!createConfig}
								onOpenChange={(v) => {
									if (!v) setCreateConfig(null)
								}}
								paperId={paperId}
								onSuccess={refetchQuestions}
								questionType={createConfig.type}
						/>
				)}
				<SelectQuestionFromBankDialog
						open={showBankDialog}
						onOpenChange={setShowBankDialog}
						paperId={paperId}
						onSuccess={refetchQuestions}
						existingIds={questions.map((q) => q.id)}
				/>
			</div>
	)
}
