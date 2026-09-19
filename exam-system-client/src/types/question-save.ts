import type { QuestionDifficulty } from '#/__generated/model/enums'
import type {
  QuestionUpdateInput_TargetOf_answers,
  QuestionUpdateInput_TargetOf_choices,
} from '#/__generated/model/static'

export interface ChoiceDto {
  content: string
  correct: boolean
}

/**
 * 选项行。
 * `id` 是服务端 `question_choices.id`：编辑已有选择题时**必须原样回传**
 * （`PUT /question/update` 会先删掉该题全部选项再按传入的 id 写回，
 * 不带 id 会 500 `NeitherIdNorKey`）。
 */
export interface ChoiceRow extends ChoiceDto {
  id?: number
}

export interface QuestionSaveReq {
  title: string
  categoryId: number
  difficulty: QuestionDifficulty
  score: number
  analysis: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'JUDGE' | 'TEXT'
  /**
   * 服务端 `QuestionExtra` 是抽象基类 + `@JsonSubTypes`，生成的 TS 类型是个**空接口**，
   * 表达不了判别联合。这里按实际形态描述。
   * ⚠️ 判别值 `type` 必须放在 extra **内部**（`@JsonTypeInfo(As.EXTERNAL_PROPERTY)` 实测是从
   * extra 内部取值的；只放顶层会 500「missing type id property 'type'」）。
   */
  extra: Record<string, unknown>
}

/**
 * 服务端生成的嵌套 input 类型（`QuestionUpdateInput_TargetOf_choices`）里**没有** `id`
 * —— Jimmer 的 TS 模型不导出嵌套在 input DTO 里的 to-many 目标的 id
 * （同样嵌在 input 里的 to-one（`answers`）却导出了，属生成器行为差异）。
 * 但接口在运行时**强制要求**每个选项都带 id，所以这里补上。
 */
export type ChoiceWithId = QuestionUpdateInput_TargetOf_choices & { id: number }

/**
 * 编辑题目的提交体（`PUT /question/update`）。
 * `answers` 只在原题已有答案行时才传（传了就必须带 `answer`；带 `id` 才能改到那一行；
 * 选择题不传也行，正确答案靠 `choices[].correct`）。
 */
export interface QuestionUpdatePayload {
  id: number
  title: string
  categoryId: number
  difficulty: QuestionDifficulty
  score: number
  analysis: string
  choices: ChoiceWithId[]
  answers?: QuestionUpdateInput_TargetOf_answers
}

/**
 * 给「新加的选项」造一个 id。
 *
 * 起因：`PUT /question/update` 的实现是「先删光该题选项，再按传入的 id 写回」，
 * 而 Jimmer 保存没有 id 的子对象会直接拒（`NeitherIdNorKey`），`id: null` 同样 500。
 * 所以新选项只能自己带一个 id，服务端会**原样写入**（实测）。
 *
 * 取值避开自增区间（当前 `question_choices` 自增约 3xx），从 20 亿起，
 * 且不超过 `int unsigned` 上限 4294967295。
 * 更干净的做法是后端让新选项不设 id、交给数据库自增 —— 属待定的后端改动。
 */
let tempChoiceIdSeq = 0
export const nextTempChoiceId = (): number => {
  tempChoiceIdSeq += 1
  return 2_000_000_000 + tempChoiceIdSeq
}
