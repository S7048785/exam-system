import type { QuestionsCategoriesTree } from '#/__generated/model/static'

// 扁平化分类数据
export function flattenCategories(
  categories: readonly QuestionsCategoriesTree[],
  level = 0,
): Array<{ id: number; name: string; level: number }> {
  const result: Array<{ id: number; name: string; level: number }> = []
  for (const cat of categories) {
    result.push({ id: cat.id, name: cat.name, level })
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, level + 1))
    }
  }
  return result
}
