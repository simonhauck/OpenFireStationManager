import { CheckIcon } from "lucide-react"

import { cn } from "#/lib/utils"

export type StepStatus = "completed" | "active" | "upcoming"

export interface Step {
  label: string
  description?: string
}

export interface VerticalStepperProps {
  steps: Step[]
  /** 1-based index of the currently active step */
  currentStep: number
  className?: string
  /** Called when a completed step is clicked; receives the 1-based step number */
  onStepClick?: (stepNumber: number) => void
}

/**
 * A vertical step indicator for multi-step wizards.
 *
 * Steps before `currentStep` are shown as completed (filled circle with
 * checkmark), the current step is highlighted, and later steps are shown as
 * upcoming (muted).
 */
export function VerticalStepper({
  steps,
  currentStep,
  className,
  onStepClick,
}: VerticalStepperProps) {
  return (
    <ol className={cn("flex flex-col", className)} aria-label="Wizard steps">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const status: StepStatus =
          stepNumber < currentStep
            ? "completed"
            : stepNumber === currentStep
              ? "active"
              : "upcoming"

        const isLast = index === steps.length - 1
        const isClickable = status === "completed" && !!onStepClick

        return (
          <li key={stepNumber} className="flex items-stretch gap-4">
            {/* Left column: circle + connector line */}
            <div className="flex flex-col items-center">
              <StepCircle
                status={status}
                stepNumber={stepNumber}
                isClickable={isClickable}
                onClick={
                  isClickable ? () => onStepClick(stepNumber) : undefined
                }
              />
              <RenderIf when={!isLast}>
                <div
                  className={cn(
                    "my-1 w-0.5 flex-1",
                    status === "completed" ? "bg-primary" : "bg-border",
                  )}
                />
              </RenderIf>
            </div>

            {/* Right column: label + description */}
            <div
              className={cn(
                "pb-6",
                isLast && "pb-0",
                isClickable && "cursor-pointer",
              )}
              onClick={isClickable ? () => onStepClick(stepNumber) : undefined}
            >
              <p
                className={cn(
                  "text-sm font-semibold leading-none",
                  status === "active" && "text-foreground",
                  status === "completed" && "text-foreground",
                  status === "upcoming" && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              <RenderIf when={!!step.description}>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    status === "upcoming"
                      ? "text-muted-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.description}
                </p>
              </RenderIf>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface StepCircleProps {
  status: StepStatus
  stepNumber: number
  isClickable?: boolean
  onClick?: () => void
}

function StepCircle({
  status,
  stepNumber,
  isClickable,
  onClick,
}: StepCircleProps) {
  return (
    <div
      aria-current={status === "active" ? "step" : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.()
            }
          : undefined
      }
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
        status === "completed" &&
          "border-primary bg-primary text-primary-foreground",
        status === "active" && "border-primary bg-background text-primary",
        status === "upcoming" &&
          "border-border bg-background text-muted-foreground",
        isClickable && "cursor-pointer hover:opacity-80",
      )}
    >
      <RenderIf when={status === "completed"}>
        <CheckIcon className="size-4" />
      </RenderIf>
      <RenderIf when={status !== "completed"}>
        <span>{stepNumber}</span>
      </RenderIf>
    </div>
  )
}

// Inline RenderIf to avoid circular dep concerns (same logic)
function RenderIf({
  when,
  children,
}: {
  when: boolean
  children: React.ReactNode
}) {
  return when ? <>{children}</> : null
}
