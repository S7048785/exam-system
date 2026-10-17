import { Textarea } from '#/components/ui/textarea.tsx'
import { cn } from '#/lib/utils.ts'
import { QUESTION_TYPE_META } from '#/features/exam/taking/constants.ts'
import { optionLetter, optionsOf } from '#/features/exam/taking/utils.ts'
import type { ExamQuestion } from '#/features/exam/taking/types.ts'

/**
 * 一道题：题头（序号 + 题型 + 分值）+ 题干 + 作答区。
 *
 * 作答区按题型走：单选 / 判断 → radio，多选 → checkbox，简答 → 文本域。
 * 对外只暴露一个 `onChange(next)`（`next` 就是这一题新的答案数组），
 * 由调用方原样写进答案表，组件本身不关心「单选还是多选」的落库口径。
 */
export function QuestionCard({
  no,
  question,
  value,
  onChange,
}: {
  /** 整卷内连续题号（从 1 开始） */
  no: number
  question: ExamQuestion
  /** 该题当前答案；未作答是空数组 */
  value: string[]
  onChange: (next: string[]) => void
}) {
  const meta = QUESTION_TYPE_META[question.type]
  const options = optionsOf(question)

  return (
    <section
      id={`question-${question.id}`}
      className="bg-card scroll-mt-6 border p-5 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums">
          {no}
        </span>
        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
          {meta.label}
        </span>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {question.score} 分
        </span>
      </div>

      <p className="text-md leading-relaxed whitespace-pre-wrap">
        {question.title}
      </p>

      <div className="mt-4">
        {question.type === 'TEXT' ? (
          <Textarea
            value={value[0] ?? ''}
            onChange={(event) => onChange([event.target.value])}
            placeholder="请输入作答内容"
            className="min-h-28"
          />
        ) : options.length === 0 ? (
          <p className="text-muted-foreground text-sm">该题暂无选项</p>
        ) : (
          <>
            <p className="text-muted-foreground mb-2 text-right text-xs">
              {meta.hint}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {options.map((option, index) => {
                const checked = value.includes(option.value)
                return (
                  <label
                    key={`${question.id}-${index}`}
                    className={cn(
                      // relative 不能删：里面那个 sr-only 的 input 是 position:absolute，
                      // 没有定位祖先时它的包含块会落到初始包含块（视口）上，被放到题目列表
                      // 深处的「静态位置」⇒ 撑出整页（文档）的滚动条，且 main 的 overflow 裁不住它。
                      'relative flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
                      checked
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/60',
                    )}
                  >
                    <input
                      type={meta.multiple ? 'checkbox' : 'radio'}
                      name={
                        meta.multiple ? undefined : `question-${question.id}`
                      }
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        if (!meta.multiple) {
                          onChange([option.value])
                          return
                        }
                        onChange(
                          checked
                            ? value.filter((item) => item !== option.value)
                            : [...value, option.value],
                        )
                      }}
                    />
                    <span
                      className={cn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 text-muted-foreground',
                      )}
                    >
                      {optionLetter(index)}
                    </span>
                    <span className="text-sm leading-relaxed whitespace-pre-wrap">
                      {option.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
