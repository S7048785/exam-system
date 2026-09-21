import { CheckCircle } from 'lucide-react'

type Step = 1 | 2

interface StepIndicatorProps {
  currentStep: Step
}

/**
 * 只有两步：选文件 → 看结果。
 * 原来的「预览数据」那一步随「一次上传直接导入」取消了。
 */
export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-4 px-6">
      <StepDot index={1} current={currentStep} label="选择文件" />
      <div className="bg-border h-px w-12" />
      <StepDot index={2} current={currentStep} label="导入结果" />
    </div>
  )
}

function StepDot({
  index,
  current,
  label,
}: {
  index: Step
  current: Step
  label: string
}) {
  const active = current >= index

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
          active
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {current > index ? <CheckCircle className="h-4 w-4" /> : index}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  )
}
