import type { Step } from './constants'
import { STEPS } from './constants'
import { CheckIcon } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: Step
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = step.id < currentStep

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                } `}
              >
                {isCompleted ? <CheckIcon className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={`text-sm font-medium ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'} `}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-12 ${isCompleted ? 'bg-primary' : 'bg-muted'} `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
