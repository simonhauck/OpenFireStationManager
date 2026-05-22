import type { ReactNode } from "react"

interface PageSubSectionProps {
  title: string
  subtitle?: string
  right?: ReactNode
  children?: ReactNode
}

export default function PageSubSection({
  title,
  subtitle,
  right,
  children,
}: PageSubSectionProps) {
  return (
    <div
      data-testid={`section-${title}`}
      className="border-border [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-6 pb-6 last:pb-0"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>
          )}
        </div>

        {right && <div className="flex items-center">{right}</div>}
      </div>

      {/* Body */}
      {children}
    </div>
  )
}
