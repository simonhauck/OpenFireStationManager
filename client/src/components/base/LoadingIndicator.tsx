import { LoaderCircle } from "lucide-react"

interface LoadingIndicatorProps {
  label?: string
  className?: string
}

export default function LoadingIndicator({
  label = "Wird geladen...",
  className,
}: LoadingIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm text-muted-foreground ${className ?? ""}`.trim()}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
