import { ButtonGroup } from '#/components/ui/button-group.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Field } from '#/components/ui/field.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Textarea } from '#/components/ui/textarea.tsx'
import { toast } from 'sonner'

interface StepPublishExamProps {
  paperId: number
  description: string
}

const BASE_URL = import.meta.env.VITE_WEB_URL
export default function StepPublishExam({
  paperId,
  description,
}: StepPublishExamProps) {
  const examUrl = `${BASE_URL}/exam/${paperId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + examUrl)
      toast.success('链接已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleOpen = () => {
    window.open(examUrl, '_blank')
  }

  return (
    <div className="flex h-full flex-col gap-6 px-40">
      <div>
        <div className="mb-4 flex items-center">
          <div className="mr-2 text-lg font-medium">考试入口</div>
          <div className="text-muted-foreground border-l-2 pl-2 text-sm">
            将链接发给考生，考生打开链接或扫码即可参加
          </div>
        </div>
        <div className="flex items-center gap-2 border p-8 shadow-lg">
          <Field>
            <ButtonGroup>
              <div className="border-b-input placeholder:text-muted-foreground focus-visible:border-b-ring inline-flex h-10 w-full min-w-0 items-center border bg-transparent py-1 ps-4 caret-transparent transition-[color,border-color] outline-none">
                <a
                  href={examUrl}
                  target="_blank"
                  style={{ color: '#128beb' }}
                  rel="noopener noreferrer"
                >
                  {examUrl}
                </a>
              </div>

              {/* <Input id="input-button-group" placeholder="Type to search..." /> */}
              <Button variant="outline" onClick={handleCopy}>
                复制链接
              </Button>
            </ButtonGroup>
          </Field>

          <Button onClick={handleOpen}>打开链接</Button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center">
          <h3 className="mr-2 text-lg font-medium">考试须知</h3>
          <div className="text-muted-foreground border-l-2 pl-2 text-sm">
            将链接发给考生，考生打开链接或扫码即可参加
          </div>
        </div>
        <div className="border p-8 shadow-lg">
          <Textarea value={description} readOnly className="min-h-30" />
        </div>
      </div>
    </div>
  )
}
