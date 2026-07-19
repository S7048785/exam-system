import {useState} from 'react'
import {Button} from '#/components/ui/button'
import {Popover, PopoverContent, PopoverTrigger,} from '#/components/ui/popover'
import {ChevronDown, ChevronRight, File, Folder} from 'lucide-react'
import {cn} from '#/lib/utils.ts'

/** 通用树节点接口 — PaperCategoriesTree 和 QuestionsCategoriesTree 都符合 */
export interface TreeNode {
  readonly id: number
  readonly name: string
  readonly children?: readonly TreeNode[] | null
}

interface CategoryTreePickerProps {
  nodes: readonly TreeNode[]
  value?: number
  onChange: (id: number) => void
  placeholder?: string
  className?: string
}

/** 在树中按 id 查找节点名称 */
function findNodeName(
  nodes: readonly TreeNode[],
  id: number,
): string | undefined {
  for (const node of nodes) {
    if (node.id === id) return node.name
    if (node.children?.length) {
      const found = findNodeName(node.children, id)
      if (found) return found
    }
  }
  return undefined
}

/** 递归渲染树节点 */
function TreeNodeItem({
  node,
  selectedId,
  onSelect,
}: {
  node: TreeNode
  selectedId?: number
  onSelect: (id: number) => void
}) {
  const hasChildren = !!node.children?.length
  const [expanded, setExpanded] = useState(true)
  const isSelected = node.id === selectedId

  return (
    <div>
      <button
        type="button"
        className={cn(
          'hover:bg-accent flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
          isSelected && 'bg-accent text-accent-foreground font-medium',
        )}
        onClick={() => onSelect(node.id)}
      >
        {/* 展开/折叠图标 */}
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="shrink-0 cursor-pointer"
          >
            {expanded ? (
              <ChevronDown className="text-muted-foreground size-4" />
            ) : (
              <ChevronRight className="text-muted-foreground size-4" />
            )}
          </span>
        ) : (
          <span className="size-4 shrink-0" />
        )}

        {/* 文件夹/文件图标 */}
        {hasChildren ? (
          <Folder className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <File className="text-muted-foreground size-4 shrink-0" />
        )}

        {/* 名称 */}
        <span className="truncate">{node.name}</span>
      </button>

      {/* 子节点 */}
      {hasChildren && expanded && (
        <div className="ml-4 border-l pl-2">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 通用分类树选择器
 *
 * 适用场景：试卷分类选择、试题分类选择
 *
 * @example
 * ```tsx
 * <CategoryTreePicker
 *   nodes={categoryTree}
 *   value={categoryId}
 *   onChange={setCategoryId}
 *   placeholder="选择分类"
 * />
 * ```
 */
export default function CategoryTreePicker({
  nodes,
  value,
  onChange,
  placeholder = '选择分类',
  className,
}: CategoryTreePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedName = value ? findNodeName(nodes, value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-between font-normal',
            !selectedName && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selectedName || placeholder}</span>
          <ChevronDown className="text-muted-foreground ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <div className="max-h-[50vh] overflow-y-auto p-1">
          {nodes.length === 0 ? (
            <p className="text-muted-foreground px-2 py-4 text-center text-sm">
              暂无分类
            </p>
          ) : (
            nodes.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                selectedId={value}
                onSelect={(id) => {
                  onChange(id)
                  setOpen(false)
                }}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
