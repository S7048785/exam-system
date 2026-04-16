import { STEPS, type Step } from './constants'
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
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  transition-colors duration-200
                  ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {isCompleted ? <CheckIcon className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`
                  text-sm font-medium
                  ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                `}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`
                  w-12 h-0.5 mx-2
                  ${isCompleted ? 'bg-primary' : 'bg-muted'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
