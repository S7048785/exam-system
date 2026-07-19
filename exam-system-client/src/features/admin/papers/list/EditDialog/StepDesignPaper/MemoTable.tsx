import {memo, useMemo} from "react";
import {cn} from "#/lib/utils.ts";
import {createColumnHelper, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {QUESTION_TYPE_MAP} from '#/features/admin/papers/constants.ts'
import type {PaperDetail_TargetOf_questions} from '#/__generated/model/static'
import {Input} from "#/components/ui/input.tsx";
import {Button} from "#/components/ui/button.tsx";

const getTypeLabel = (type: string) => {
	const entry = QUESTION_TYPE_MAP[type]
	return entry.label
}

const renderAnswer = (q: PaperDetail_TargetOf_questions) => {
	if (q.type === 'CHOICE') {
		const correct = q.choices.filter((c) => c.correct)
		if (correct.length > 0) {
			return String(
					correct
							.map((c) => String.fromCharCode(q.choices.indexOf(c) + 65))
							.join(', '),
			)
		}
		return q.answer
	}
	if (q.type === 'JUDGE') {
		return q.answer === 'true' || q.answer === 'T' ? '对' : '错'
	}
	return q.answer
}

interface MemoTableProps {
	questions: readonly PaperDetail_TargetOf_questions[]
	activeIndex: number | undefined
	rowRefs: React.MutableRefObject<(HTMLTableRowElement | null)[]>
	onScoreBlur: (id: number, score: string) => void
	onDelete: (id: number) => void
}

export default memo(function ({
																	 questions,
																	 activeIndex,
																	 rowRefs,
																	 onScoreBlur,
																	 onDelete,
																 }: MemoTableProps) {
	const columnHelper = createColumnHelper<PaperDetail_TargetOf_questions>()

	const columns = [
		columnHelper.display({
			id: 'index',
			header: '序号',
			cell: ({row}) => row.index + 1,
			size: 56,
		}),
		columnHelper.accessor('type', {
			header: '题型',
			cell: ({getValue}) => getTypeLabel(getValue()),
			size: 80,
		}),
		columnHelper.accessor('title', {
			header: '试题内容',
			cell: ({getValue}) => (
					<span className="block max-w-xs truncate">{getValue()}</span>
			),
		}),
		columnHelper.display({
			id: 'answer',
			header: '标准答案',
			cell: ({row}) => (
					<div className="w-28 truncate">{renderAnswer(row.original)}</div>
			),
			size: 112,
		}),
		columnHelper.accessor('score', {
			header: '分数',
			cell: ({row, getValue}) => (
					<Input
							type="number"
							min={0}
							defaultValue={getValue()}
							className="h-8 w-20"
							onBlur={(e) => onScoreBlur(row.original.id, e.target.value)}
					/>
			),
			size: 96,
		}),
		columnHelper.display({
			id: 'actions',
			header: '操作',
			cell: ({row}) => (
					<Button
							variant="ghost"
							size="sm"
							className="text-destructive h-7 px-1"
							onClick={() => onDelete(row.original.id)}
					>
						删除
					</Button>
			),
			size: 64,
		}),
	]

	const data = useMemo(() => [...questions], [questions])

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
			<table className="w-full text-left text-sm">
				<thead className="bg-muted sticky top-0">
				{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
									<th
											key={header.id}
											className="px-3 py-2 font-medium"
											style={{width: header.getSize()}}
									>
										{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
												)}
									</th>
							))}
						</tr>
				))}
				</thead>
				<tbody>
				{table.getRowModel().rows.map((row) => (
						<tr
								key={row.id}
								ref={(el) => {
									rowRefs.current[row.index] = el
								}}
								className={cn(
										'border-t transition-colors',
										activeIndex === row.index ? 'bg-primary/40' : 'hover:bg-muted/30',
								)}
						>
							{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-3 py-2">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
							))}
						</tr>
				))}
				{table.getRowModel().rows.length === 0 && (
						<tr>
							<td colSpan={6} className="text-muted-foreground py-12 text-center">
								暂未添加题目，请点击下方按钮添加
							</td>
						</tr>
				)}
				</tbody>
			</table>
	)
})