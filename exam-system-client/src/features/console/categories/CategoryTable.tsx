import type { QuestionsCategoriesTree } from '#/__generated/model/static'
import { flattenTree } from '#/lib/tree-util.ts'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover.tsx'
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react'

interface CategoryTableProps {
  data: readonly QuestionsCategoriesTree[]
  expandedIds: Set<number>
  onToggleExpand: (id: number) => void
  onAddChild: (parentId: number) => void
  onEdit: (category: QuestionsCategoriesTree) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}

export default function CategoryTable({
  data,
  expandedIds,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  onRefresh,
}: CategoryTableProps) {
  const flatData = flattenTree(data, (category) => expandedIds.has(category.id))

  // 统计总分类数
  const totalCount = flattenTree(data).length

  return (
    <div className="space-y-2">
      {/* 操作栏 */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RotateCw className="mr-1 h-4 w-4" />
          刷新
        </Button>
        <span className="text-muted-foreground text-sm">
          共 {totalCount} 个分类
        </span>
      </div>

      {/* 表格 */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="w-12">展开</TableHead>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>分类名称</TableHead>
              <TableHead className="w-24">排序</TableHead>
              <TableHead className="w-24">题目数量</TableHead>
              <TableHead className="w-48">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatData.map((category) => {
              const hasChildren =
                category.children && category.children.length > 0
              const isExpanded = expandedIds.has(category.id)
              const isTopLevel = category.level === 0

              return (
                <TableRow key={category.id} className="hover:bg-muted/50">
                  {/* 展开/折叠按钮 */}
                  <TableCell>
                    {hasChildren ? (
                      <button
                        onClick={() => onToggleExpand(category.id)}
                        className="hover:bg-muted rounded p-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <span className="w-6" />
                    )}
                  </TableCell>

                  <TableCell className="font-medium">{category.id}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          paddingLeft: category.level * 20,
                        }}
                      >
                        {category.name}
                      </span>
                      {isTopLevel && (
                        <Badge variant="outline" className="text-xs">
                          顶级
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{category.sort}</TableCell>

                  <TableCell>
                    <Badge variant="secondary">{category.questionCount}</Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isTopLevel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddChild(category.id)}
                          title="添加子分类"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          添加
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(category)}
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
                                onClick={() => onDelete(category.id)}
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
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
