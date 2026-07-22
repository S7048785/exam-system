import { cn } from '#/lib/utils.ts'

interface Step {
  title: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick: (index: number) => void
}

export default function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, index) => (
        <button
          key={index}
          type="button"
          className="flex cursor-pointer items-center gap-1"
          onClick={() => onStepClick(index)}
        >
          {index > 0 && (
            <span className="text-muted-foreground mx-1 h-px w-4 bg-current" />
          )}
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-full text-lg',
              index <= currentStep
                ? 'bg-primary text-white'
                : 'text-muted-foreground border',
            )}
          >
            {index + 1}
          </div>
          <div className={cn(index > currentStep && 'text-muted-foreground')}>
            {step.title}
          </div>
        </button>
      ))}
    </div>
  )
}
