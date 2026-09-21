import type { QuestionSaveReq } from '#/__generated/model/static'

/**
 * 题目表单（题目抽屉、试卷内建题）用到的 UI 类型。
 *
 * ⚠️ 这里**只放生成代码给不了的**：
 * - `QuestionSaveReq` / `QuestionType` 这类契约类型一律用生成的
 *   （`#/__generated/model/static`、`#/__generated/model/enums`）；
 * - 后端的 `ChoiceDto` / `SingleChoiceExtra` 等**没有被 Jimmer 导出**（生成代码里只有一个
 *   空基类 `QuestionExtra`），所以"选项行"只能手写。
 *
 * 这个文件原来叫 `question-save.ts`，名字有误导性：它并不承担保存契约，
 * 契约在 `__generated` 里都有。
 */

/** 选项行。比后端 `ChoiceDto` 多一个 `id`，仅用于表单回填时保持 React key 稳定。 */
export interface ChoiceRow {
  id?: number
  content: string
  correct: boolean
}

/**
 * 修改题目的提交体：与新增共用 `QuestionSaveReq`，额外带一个**路径参数** `id`。
 * 注意后端 `PUT /question/update/{id}` 的 id 在路径上，body 就是 `QuestionSaveReq`，
 * 提交时要拆开传：`const { id, ...body } = input`。
 */
export type QuestionUpdateReq = QuestionSaveReq & { id: number }

/** 表单内部的临时行 id（负数，与后端真实 id 区分）。 */
let tempChoiceSeq = 0

/**
 * 生成一行选项的临时 id。
 * ⚠️ `ChoiceForm` 原本从旧的 `question-save.ts` import 这个函数，但那边**从未定义过**它
 * —— 一打开题目抽屉就会 `nextTempChoiceId is not a function`。
 */
export function nextTempChoiceId(): number {
  return --tempChoiceSeq
}
