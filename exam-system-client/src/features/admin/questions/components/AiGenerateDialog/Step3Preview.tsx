import type { QuestionGenerateDto } from '#/__generated/model/static'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'

interface Step3PreviewProps {
  data: readonly QuestionGenerateDto[]
  isImporting: boolean
  onBack: () => void
  onImport: () => void
}

// 题型映射
const TYPE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  SINGLE_CHOICE: { label: '单选题', variant: 'default' },
  MULTIPLE_CHOICE: { label: '多选题', variant: 'default' },
  JUDGE: { label: '判断题', variant: 'secondary' },
  TEXT: { label: '简答题', variant: 'outline' },
}

// 难度映射
const DIFFICULTY_MAP: Record<string, { label: string; className: string }> = {
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

export default function Step3Preview({
  data,
  isImporting,
  onBack,
  onImport,
}: Step3PreviewProps) {
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            共 {data.length} 道题目
          </span>
        </div>

        <div className="space-y-4 pr-4">
          {data.map((question, index) => {
            const typeInfo = TYPE_MAP[question.type] ?? {
              label: question.type,
              variant: 'secondary' as const,
            }
            const difficultyInfo = DIFFICULTY_MAP[question.difficulty] ?? {
              label: question.difficulty,
              className: '',
            }

            return (
              <div
                key={index}
                className="bg-card space-y-3 rounded-lg border p-4"
              >
                {/* 题号和标签 */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm font-medium">
                    #{index + 1}
                  </span>
                  <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                  <span
                    className={`rounded px-2 py-1 text-xs ${difficultyInfo.className}`}
                  >
                    {difficultyInfo.label}
                  </span>
                  {question.type === 'MULTIPLE_CHOICE' && (
                    <Badge variant="outline" className="text-xs">
                      多选
                    </Badge>
                  )}
                </div>

                {/* 题目内容 */}
                <div className="text-sm font-medium">{question.title}</div>

                {/* 选项（如果是选择题） */}
                {(question.type === 'SINGLE_CHOICE' ||
                  question.type === 'MULTIPLE_CHOICE') && (
                  <div className="space-y-1.5 pl-4">
                    {question.choices.map((choice, choiceIndex) => (
                      <div
                        key={choiceIndex}
                        className="text-muted-foreground text-sm"
                      >
                        {String.fromCharCode(65 + choiceIndex)}. {choice}
                      </div>
                    ))}
                  </div>
                )}

                {/* 答案 */}
                <div className="text-sm">
                  <span className="text-muted-foreground">答案：</span>
                  <span className="font-medium">{question.answer}</span>
                </div>

                {/* 解析 */}
                {question.analysis && (
                  <div className="text-muted-foreground text-sm">
                    <span className="font-medium">解析：</span>
                    {question.analysis}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <DialogFooter className="mt-6 border-t px-0 py-4">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          重新生成
        </Button>
        <Button onClick={onImport} disabled={data.length === 0 || isImporting}>
          {isImporting ? '导入中...' : '确认导入'}
        </Button>
      </DialogFooter>
    </>
  )
}
