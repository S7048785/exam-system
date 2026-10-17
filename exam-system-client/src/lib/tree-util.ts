/**
 * 树遍历工具：控制台的分类树（试题分类 / 试卷分类）和「从题库选题」都用它，
 * 别再各写一份递归。
 */

/** 树节点的最小形状：`children` 自引用、可缺省 —— 生成的 `*CategoriesTree` 直接满足 */
export type TreeLike<T> = {
  readonly children?: ReadonlyArray<T> | undefined
}

/**
 * 树 → 一维列表（深度优先，带 `level`，根层级为 0）。
 *
 * 传了 `expanded` 时，返回 false 的节点只输出自己、**不下钻子树**（表格「只列已展开的分支」用）；
 * 不传就是整棵树摊平（数总数也用它）。
 */
export function flattenTree<T extends TreeLike<T>>(
  nodes: ReadonlyArray<T>,
  expanded?: (node: T) => boolean,
): Array<T & { level: number }> {
  const walk = (
    list: ReadonlyArray<T>,
    level: number,
  ): Array<T & { level: number }> => {
    const out: Array<T & { level: number }> = []
    for (const node of list) {
      out.push({ ...node, level })
      const children = node.children
      if (!children || children.length === 0) continue
      if (expanded && !expanded(node)) continue
      out.push(...walk(children, level + 1))
    }
    return out
  }
  return walk(nodes, 0)
}

/** 深度优先找第一个满足条件的节点，找不到返回 `undefined` */
export function findInTree<T extends TreeLike<T>>(
  nodes: ReadonlyArray<T>,
  predicate: (node: T) => boolean,
): T | undefined {
  for (const node of nodes) {
    if (predicate(node)) return node
    const found = node.children
      ? findInTree(node.children, predicate)
      : undefined
    if (found) return found
  }
  return undefined
}
