import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  message?: string
  className?: string
}

export default function ErrorState({
  message = "Es ist ein Fehler aufgetreten.",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive ${className ?? ""}`.trim()}
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
