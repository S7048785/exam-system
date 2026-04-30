import type {CategoriesTree, QuestionListReq, QuestionsPageView,} from '#/__generated/model/static'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '#/components/ui/table'
import {Badge} from '#/components/ui/badge'
import {Button} from '#/components/ui/button'
import {Input} from '#/components/ui/input'
import {Label} from '#/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '#/components/ui/select'
import {Popover, PopoverContent, PopoverTrigger,} from '#/components/ui/popover'
import {HelpCircle, Pencil, Plus, RotateCw, Sparkles, Trash2, Upload,} from 'lucide-react'
import {toast} from 'sonner'
import {flattenCategories} from './utils'

// 题型映射
const TYPE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  CHOICE: { label: '选择题', variant: 'default' },
  JUDGE: { label: '判断题', variant: 'secondary' },
  TEXT: { label: '简答题', variant: 'outline' },
}

// 难度映射
const DIFFICULTY_MAP: Record<string, { label: string; className: string }> = {
  EASY: {
    label: '简单',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  MEDIUM: {
    label: '普通',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  HARD: {
    label: '困难',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
}

interface QuestionTableProps {
  data: readonly QuestionsPageView[]
  total: number
  page: number
  size: number
  filters: QuestionListReq
  categories: readonly CategoriesTree[]
  onRefresh: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onFiltersChange: (filters: QuestionListReq) => void
  onAdd: () => void
  onEdit: (question: QuestionsPageView) => void
  onDelete: (id: number) => void
  onImport: () => void
  onAiGenerate: () => void
}

export default function QuestionTable({
  data,
  total,
  page,
  size,
  filters,
  categories,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  onFiltersChange,
  onAdd,
  onEdit,
  onDelete,
  onImport,
  onAiGenerate,
}: QuestionTableProps) {
  const flatCategories = flattenCategories(categories)

  // 计算总页数
  const totalPages = Math.ceil(total / size)

  // 分类名称映射
  const categoryNameMap = new Map(flatCategories.map((c) => [c.id, c.name]))

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex flex-wrap items-end gap-3">
        {/* 分类筛选 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">分类</Label>
          <Select
            value={filters.categoryId?.toString() || 'all'}
            onValueChange={(val) =>
              onFiltersChange({
                ...filters,
                categoryId: val === 'all' ? undefined : Number(val),
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {'　'.repeat(cat.level)}
                  {cat.level > 0 && '├ '}
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 难度筛选 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">难度</Label>
          <Select
            value={filters.difficulty || 'all'}
            onValueChange={(val) =>
              onFiltersChange({
                ...filters,
                difficulty: val === 'all' ? undefined : val,
              })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="全部难度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部难度</SelectItem>
              {Object.entries(DIFFICULTY_MAP).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 类型筛选 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">类型</Label>
          <Select
            value={filters.type || 'all'}
            onValueChange={(val) =>
              onFiltersChange({
                ...filters,
                type: val === 'all' ? undefined : val,
              })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {Object.entries(TYPE_MAP).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 关键词搜索 */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">关键词</Label>
          <Input
            placeholder="搜索题目..."
            className="w-48"
            value={filters.keyword || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                keyword: e.target.value || undefined,
              })
            }
          />
        </div>

        {/* 刷新按钮 */}
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RotateCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">共 {total} 道题目</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onImport}>
            <Upload className="h-4 w-4 mr-1" />
            导入
          </Button>
          <Button size="sm" variant="outline" onClick={onAiGenerate}>
            <Sparkles className="h-4 w-4 mr-1" />
            AI生成
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            新增题目
          </Button>
        </div>
      </div>

      {/* 表格 */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
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
                  className="text-center py-8 text-muted-foreground"
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
                        className={`text-xs px-2 py-1 rounded ${difficultyInfo.className}`}
                      >
                        {difficultyInfo.label}
                      </span>
                    </TableCell>

                    <TableCell>{question.score || '-'}</TableCell>

                    <TableCell>
                      {question.categoryId ? (
                        <span className="text-sm truncate max-w-24 block">
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
                          <Pencil className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              删除
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start gap-2">
                                <HelpCircle className="h-5 w-5 text-destructive mt-0.5" />
                                <div className="space-y-1">
                                  <h4 className="font-medium leading-none">
                                    确定要删除吗？
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
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
          <div className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页，每页{' '}
            <Select
              value={size.toString()}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="w-20 h-8">
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
