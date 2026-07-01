import { Sparkles } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { DialogFooter } from '#/components/ui/dialog'

export default function Step2Generating() {
  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <div className="relative">
          <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
            <Sparkles className="text-primary h-10 w-10 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-medium">AI 正在生成题目...</h3>
          <p className="text-muted-foreground text-sm">正在生成题目，请稍候</p>
        </div>
      </div>

      <DialogFooter className="mt-6 border-t px-0 py-4">
        <Button variant="outline" disabled>
          生成中，请稍候...
        </Button>
      </DialogFooter>
    </>
  )
}
