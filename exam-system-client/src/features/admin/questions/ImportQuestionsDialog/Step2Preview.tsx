import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { QuestionImportView } from '#/__generated/model/static'
import { DIFFICULTY_MAP, renderChoicesAndAnswer, TYPE_MAP } from './constants'

interface Step2PreviewProps {
  data: readonly QuestionImportView[]
}

export default function Step2Preview({ data }: Step2PreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          共 {data.length} 道题目，确认无误后点击"确认导入"
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="w-12">序号</TableHead>
              <TableHead>题目内容</TableHead>
              <TableHead className="w-20">题型</TableHead>
              <TableHead className="w-20">难度</TableHead>
              <TableHead className="w-16">分值</TableHead>
              <TableHead className="w-64">选项/答案</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((question, index) => {
              const typeInfo = TYPE_MAP[question.type] ?? {
                label: question.type,
                variant: 'secondary' as const,
              }
              const difficultyInfo = DIFFICULTY_MAP[question.difficulty] ?? {
                label: question.difficulty,
                className: '',
              }

              return (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="max-w-md truncate" title={question.title}>
                      {question.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        typeInfo.variant === 'default'
                          ? 'bg-primary/10 text-primary'
                          : typeInfo.variant === 'secondary'
                            ? 'bg-secondary text-secondary-foreground'
                            : 'border-input border'
                      }`}
                    >
                      {typeInfo.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded px-2 py-1 text-xs ${difficultyInfo.className}`}
                    >
                      {difficultyInfo.label}
                    </span>
                  </TableCell>
                  <TableCell>{question.score || '-'}</TableCell>
                  <TableCell>
                    {renderChoicesAndAnswer(
                      question.type,
                      question.choices,
                      question.answer,
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
