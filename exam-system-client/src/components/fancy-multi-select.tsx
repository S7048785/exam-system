import type { CategoriesTree } from '#/__generated/model/static'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import * as React from 'react'

interface FancyMultiSelectProps {
  value: number[]
  onChange: (ids: number[]) => void
  categories: readonly CategoriesTree[]
}

export function FancyMultiSelect({
  value,
  onChange,
  categories,
}: FancyMultiSelectProps) {
  // 可选择的项目（排除已选中的）
  const selectables = React.useMemo(
    () => categories.filter((c) => value.includes(c.id)),
    [categories, value],
  )
  const anchor = useComboboxAnchor()

  return (
    <Combobox items={categories} multiple onValueChange={onChange}>
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {selectables.map((item) => (
            <ComboboxChip key={item.id}>{item.name}</ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput placeholder="添加分类" />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item.id}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
