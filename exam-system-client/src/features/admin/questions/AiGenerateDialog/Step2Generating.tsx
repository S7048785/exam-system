import {Sparkles} from 'lucide-react'
import {Button} from '#/components/ui/button'
import {DialogFooter} from '#/components/ui/dialog'

export default function Step2Generating() {
  return (
    <>
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="relative">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">AI 正在生成题目...</h3>
          <p className="text-sm text-muted-foreground">正在生成题目，请稍候</p>
        </div>
      </div>

      <DialogFooter className="px-0 py-4 border-t mt-6">
        <Button variant="outline" disabled>
          生成中，请稍候...
        </Button>
      </DialogFooter>
    </>
  )
}
