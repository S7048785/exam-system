import {CheckCircle} from 'lucide-react'

type Step = 1 | 2 | 3

interface StepIndicatorProps {
  currentStep: Step
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-4 px-6">
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 1
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
        </div>
        <span className="text-sm">选择文件</span>
      </div>
      <div className="w-12 h-px bg-border" />
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 2
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
        </div>
        <span className="text-sm">预览数据</span>
      </div>
      <div className="w-12 h-px bg-border" />
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= 3
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          3
        </div>
        <span className="text-sm">导入完成</span>
      </div>
    </div>
  )
}
