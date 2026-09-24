import { useState } from 'react'
import { Button } from '#/components/ui/button.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover.tsx'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '#/lib/utils.ts'

export interface PopoverSelectOption<T extends string = string> {
  readonly value: T
  readonly label: string
}

interface PopoverSelectProps<T extends string = string> {
  options: readonly PopoverSelectOption<T>[]
  /** 当前值；`undefined` 表示未选，触发器显示 placeholder */
  value?: T
  /** 选中某一项或清空时回调；清空传 `undefined` */
  onChange: (value: T | undefined) => void
  /** 未选中时的触发器文案，同时作为列表首项（点击即清空选择） */
  placeholder?: string
  className?: string
}

/**
 * 通用单选 Popover 选择器（触发器样式与 `CategoryTreePicker` 保持一致）。
 *
 * 适用场景：选项较少、平铺列表的枚举筛选，如「考试状态」。
 *
 * @example
 * ```tsx
 * <PopoverSelect
 *   options={[{ value: 'DRAFT', label: '草稿' }]}
 *   value={status}
 *   onChange={setStatus}
 *   placeholder="全部状态"
 *   className="w-32"
 * />
 * ```
 */
export default function PopoverSelect<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = '请选择',
  className,
}: PopoverSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  const pick = (next: T | undefined) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown className="text-muted-foreground ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <div className="max-h-[50vh] overflow-y-auto p-1">
          {/* 首项：清空选择 */}
          <button
            type="button"
            className={cn(
              'hover:bg-accent flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
              !selected && 'bg-accent text-accent-foreground font-medium',
            )}
            onClick={() => pick(undefined)}
          >
            <span className="flex-1 truncate">{placeholder}</span>
            {!selected && <Check className="size-4 shrink-0" />}
          </button>

          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'hover:bg-accent flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                  isSelected && 'bg-accent text-accent-foreground font-medium',
                )}
                onClick={() => pick(option.value)}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
