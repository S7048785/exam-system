import type { QuestionsPageView } from '#/__generated/model/static'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover.tsx'
import { HelpCircle, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DIFFICULTY_MAP, TYPE_MAP } from '#/types/questoin.ts'

interface QuestionTableProps {
  data: readonly QuestionsPageView[]
  total: number
  page: number
  size: number
  categoryNameMap: Map<number, string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (question: QuestionsPageView) => void
  onDelete: (id: number) => void
}

export default function QuestionTable({
  data,
  total,
  page,
  size,
  categoryNameMap,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: QuestionTableProps) {
  // 计算总页数
  const totalPages = Math.ceil(total / size)

  return (
    <div className="space-y-4">
      {/* 表格 */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>题目内容</TableHead>
              <TableHead className="w-20">类型</TableHead>
              <TableHead className="w-20">难度</TableHead>
              <TableHead className="w-20">分值</TableHead>
              <TableHead className="w-32">分类</TableHead>
              <TableHead className="w-48">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((question) => {
                const typeInfo = TYPE_MAP[question.type] ?? {
                  label: question.type,
                  variant: 'secondary' as const,
                }
                const difficultyInfo = DIFFICULTY_MAP[question.difficulty] ?? {
                  label: question.difficulty,
                  className: '',
                }

                return (
                  <TableRow key={question.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{question.id}</TableCell>

                    <TableCell>
                      <div className="max-w-md truncate" title={question.title}>
                        {question.title}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
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
                      {question.categoryId ? (
                        <span className="block max-w-24 truncate text-sm">
                          {categoryNameMap.get(question.categoryId) || '未知'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(question)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          编辑
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              删除
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start gap-2">
                                <HelpCircle className="text-destructive mt-0.5 h-5 w-5" />
                                <div className="space-y-1">
                                  <h4 className="leading-none font-medium">
                                    确定要删除吗？
                                  </h4>
                                  <p className="text-muted-foreground text-sm">
                                    删除后无法撤销，请谨慎操作。
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost">
                                  取消
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    onDelete(question.id)
                                    toast.success('题目删除成功')
                                  }}
                                >
                                  确定
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            第 {page} / {totalPages} 页，每页{' '}
            <Select
              value={size.toString()}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>{' '}
            条
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              上一页
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
