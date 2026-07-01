import type { QuestionImportView_TargetOf_choices } from '#/__generated/model/static'

// 题型映射
export const TYPE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  CHOICE: { label: '选择题', variant: 'default' },
  JUDGE: { label: '判断题', variant: 'secondary' },
  TEXT: { label: '简答题', variant: 'outline' },
}

// 难度映射
export const DIFFICULTY_MAP: Record<
  string,
  { label: string; className: string }
> = {
  EASY: {
    label: '简单',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  MEDIUM: {
    label: '普通',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  HARD: {
    label: '困难',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
}

// 渲染选项/答案列
export function renderChoicesAndAnswer(
  type: string,
  choices: readonly QuestionImportView_TargetOf_choices[] | undefined,
  answer: string | undefined,
) {
  if (type === 'CHOICE' && choices && choices.length > 0) {
    const choiceLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const answerSet = new Set(
      answer
        ? answer
            .split(/[,，;；]/)
            .map((a) => a.trim())
            .filter(Boolean)
        : [],
    )

    return (
      <div className="text-sm">
        {choices.map((choice, index) => {
          const label = choiceLabels[index] || `${index + 1}`
          const isCorrect =
            answerSet.has(label) || answerSet.has(choice.content)
          return (
            <div
              key={index}
              className={isCorrect ? 'text-green-600 font-medium' : ''}
            >
              {label}. {choice.content}
            </div>
          )
        })}
      </div>
    )
  }

  if (type === 'JUDGE') {
    const isCorrect =
      answer === 'true' || answer === '正确' || answer === 'T' || answer === 'Y'
    return (
      <span
        className={`text-sm ${isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}`}
      >
        {isCorrect ? '正确' : '错误'}
      </span>
    )
  }

  return <span className="text-sm text-muted-foreground">{answer || '-'}</span>
}
