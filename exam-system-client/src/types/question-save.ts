import type { QuestionDifficulty } from '#/__generated/model/enums'

export interface ChoiceDto {
  content: string
  correct: boolean
}

export interface QuestionSaveReq {
  title: string
  categoryId: number
  difficulty: QuestionDifficulty
  score: number
  analysis?: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'JUDGE' | 'TEXT'
  extra: Record<string, unknown>
}
