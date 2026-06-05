import { VerticalStepper } from "#/components/base/VerticalStepper"
import type { Step } from "#/components/base/VerticalStepper"
import RenderIf from "#/components/base/RenderIf"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import React from "react"

export interface StepperWizardStep {
  label: string
  description?: string
  content: React.ReactNode
}

export interface StepperWizardProps {
  steps: StepperWizardStep[]
  currentStep: number
  onStepClick: (step: number) => void
  disableStepClickOnLastStep?: boolean
}

export default function StepperWizard({
  steps,
  currentStep,
  onStepClick,
  disableStepClickOnLastStep = true,
}: StepperWizardProps) {
  const stepperSteps: Step[] = steps.map((s) => ({
    label: s.label,
    description: s.description,
  }))

  return (
    <div className="flex items-stretch">
      <aside className="hidden shrink-0 sm:block">
        <div className="pr-6 pb-2">
          <VerticalStepper
            steps={stepperSteps}
            currentStep={currentStep}
            onStepClick={(n) => {
              if (disableStepClickOnLastStep && currentStep === steps.length)
                return
              onStepClick(n)
            }}
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          return (
            <RenderIf key={stepNumber} when={currentStep === stepNumber}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    Schritt {stepNumber}: {step.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>{step.content}</CardContent>
              </Card>
            </RenderIf>
          )
        })}
      </div>
    </div>
  )
}
