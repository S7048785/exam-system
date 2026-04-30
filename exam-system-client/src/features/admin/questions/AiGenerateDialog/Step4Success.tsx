import {CheckCircle} from 'lucide-react'
import {Button} from '#/components/ui/button'
import {DialogFooter} from '#/components/ui/dialog'

interface Step4SuccessProps {
  count: number
  onClose: () => void
}

export default function Step4Success({ count, onClose }: Step4SuccessProps) {
  return (
    <>
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">导入成功！</h3>
          <p className="text-sm text-muted-foreground">
            成功导入 {count} 道题目到题库
          </p>
        </div>
      </div>

      <DialogFooter className="px-0 py-4 border-t mt-6">
        <Button onClick={onClose}>关闭</Button>
      </DialogFooter>
    </>
  )
}
