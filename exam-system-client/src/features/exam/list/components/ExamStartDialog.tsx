import type { PaperDto } from '#/__generated/model/dto'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangleIcon, Bookmark, Timer, Trophy } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

export function ExamStartDialog(props: {
  open: boolean
  data: PaperDto['PaperController/PAPER_ITEM'] | null
  onClose: () => void
  onExamStart: () => void
}) {
  const id = useId()
  const maxLength = 20
  const [characterCount, setCharacterCount] = useState(0)
  // 缓存要显示的试卷数据
  const [cachedData, setCachedData] = useState(props.data)

  // 每次 Dialog 打开时，如果有新的数据，就更新缓存
  useEffect(() => {
    if (props.open && props.data) {
      setCachedData(props.data)
    }
  }, [props.open, props.data])

  // 处理关闭：调用父组件的 onClose，但不影响缓存
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose()
    }
  }
  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader className="text-center">
          <DialogTitle>开始考试</DialogTitle>
          <DialogDescription>请填写您的信息开始考试</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 p-5 pt-0">
          <div className="space-y-2 rounded-lg border p-4">
            <h3 className="text-lg font-bold">{cachedData?.name}</h3>
            <p className="text-gray-500">{cachedData?.description}</p>
            <div className="flex flex-wrap gap-x-6 text-sm">
              <div className="flex items-center gap-1">
                <Bookmark size={16} />
                题目数量: <span className="">
                  {cachedData?.questionCount}
                </span>{' '}
                道
              </div>
              <div className="flex items-center gap-1">
                <Trophy size={16} />
                总分: <span className="">{cachedData?.totalScore}</span> 分
              </div>
              <div className="flex items-center gap-1">
                <Timer size={16} />
                考试时长: <span className="">{cachedData?.duration}</span> 分钟
              </div>
            </div>
          </div>
          <form onSubmit={props.onExamStart} className="">
            <div className="mb-4 grid grid-cols-[2fr_8fr] items-center gap-2">
              <div className="">
                <span className="text-destructive">*</span>考生姓名
              </div>
              <div className="flex items-center">
                <Input
                  maxLength={maxLength}
                  name="keyword"
                  type="text"
                  placeholder="请输入您的姓名"
                  onInput={(event) =>
                    setCharacterCount(
                      (event.target as HTMLInputElement).value.length,
                    )
                  }
                />
                <div
                  aria-live="polite"
                  className="text-muted-foreground pointer-events-none absolute inset-e-5 flex items-center justify-center pe-3 text-xs tabular-nums peer-disabled:opacity-50"
                  id={`${id}-description`}
                  role="status"
                >
                  {characterCount}/{maxLength}
                </div>
              </div>
            </div>
            <Button className="w-full">开始考试</Button>
          </form>
          <Alert className="mx-auto border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
            <AlertTriangleIcon />
            <AlertTitle className="mb-2 font-bold">考试规则</AlertTitle>
            <AlertDescription>
              <ul className="list-inside list-disc space-y-2">
                <li>请确保网络连接稳定</li>
                <li>考试过程中请勿切换窗口或刷新页面</li>
                <li>考试时间过后将自动收卷</li>
                <li>提交后将无法修改答案</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  )
}
