export const STEPS = [
  { id: 1, label: '设置参数' },
  { id: 2, label: 'AI生成中' },
  { id: 3, label: '预览确认' },
  { id: 4, label: '导入成功' },
] as const

export type Step = (typeof STEPS)[number]['id']

export const TYPE_OPTIONS = [
  { value: 'CHOICE', label: '选择题' },
  { value: 'JUDGE', label: '判断题' },
  { value: 'TEXT', label: '简答题' },
] as const

export const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: '简单' },
  { value: 'MEDIUM', label: '普通' },
  { value: 'HARD', label: '困难' },
] as const
