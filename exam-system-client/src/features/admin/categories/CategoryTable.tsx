import type {CategoriesTree} from '#/__generated/model/static'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '#/components/ui/table'
import {Badge} from '#/components/ui/badge'
import {Button} from '#/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger,} from '#/components/ui/popover'
import {ChevronDown, ChevronRight, HelpCircle, Pencil, Plus, RotateCw, Trash2,} from 'lucide-react'
import {toast} from 'sonner'

interface CategoryTableProps {
  data: readonly CategoriesTree[]
  expandedIds: Set<number>
  onToggleExpand: (id: number) => void
  onAddChild: (parentId: number) => void
  onEdit: (category: CategoriesTree) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}

// 将树形结构扁平化（只包含展开的节点）
function flattenTree(
  categories: readonly CategoriesTree[],
  expandedIds: Set<number>,
  level: number = 0,
): Array<CategoriesTree & { level: number }> {
  const result: Array<CategoriesTree & { level: number }> = []
  for (const category of categories) {
    result.push({ ...category, level })
    // 如果该分类已展开且有子分类，则递归展开
    if (
      expandedIds.has(category.id) &&
      category.children &&
      category.children.length > 0
    ) {
      result.push(...flattenTree(category.children, expandedIds, level + 1))
    }
  }
  return result
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
  const flatData = flattenTree(data, expandedIds)

  // 统计总分类数
  const countAll = (cats: readonly CategoriesTree[]): number => {
    let count = cats.length
    for (const cat of cats) {
      if (cat.children) {
        count += countAll(cat.children)
      }
    }
    return count
  }

  return (
    <div className="space-y-2">
      {/* 操作栏 */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RotateCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
        <span className="text-sm text-muted-foreground">
          共 {countAll(data)} 个分类
        </span>
      </div>

      {/* 表格 */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
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
                        className="p-1 hover:bg-muted rounded"
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
                          <Plus className="h-4 w-4 mr-1" />
                          添加
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(category)}
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
                                  onDelete(category.id)
                                  toast.success('分类删除成功')
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
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
