import { CheckCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'

interface Step4SuccessProps {
  count: number
  onClose: () => void
}

export default function Step4Success({ count, onClose }: Step4SuccessProps) {
  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-medium">导入成功！</h3>
          <p className="text-muted-foreground text-sm">
            成功导入 {count} 道题目到题库
          </p>
        </div>
      </div>

      <DialogFooter className="mt-6 border-t px-0 py-4">
        <Button onClick={onClose}>关闭</Button>
      </DialogFooter>
    </>
  )
}
