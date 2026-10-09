import { Spinner } from "@astryxdesign/core/Spinner"

interface LoadingIndicatorProps {
  label?: string
  className?: string
}

export default function LoadingIndicator({
  label = "Wird geladen...",
  className,
}: LoadingIndicatorProps) {
  return <Spinner size="sm" label={label} className={className} />
}
