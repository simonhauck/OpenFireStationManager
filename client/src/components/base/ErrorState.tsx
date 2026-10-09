import { Banner } from "@astryxdesign/core/Banner"

interface ErrorStateProps {
  message?: string
  className?: string
}

export default function ErrorState({
  message = "Es ist ein Fehler aufgetreten.",
  className,
}: ErrorStateProps) {
  return <Banner status="error" title={message} className={className} />
}
