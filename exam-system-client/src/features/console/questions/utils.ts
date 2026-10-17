import { flattenTree } from '#/lib/tree-util.ts'
import type { QuestionsCategoriesTree } from '#/__generated/model/static'

/** 分类树 → 下拉选项要的扁平列表（只留 id / name / level） */
export function flattenCategories(
  categories: readonly QuestionsCategoriesTree[],
): Array<{ id: number; name: string; level: number }> {
  return flattenTree(categories).map(({ id, name, level }) => ({
    id,
    name,
    level,
  }))
}
