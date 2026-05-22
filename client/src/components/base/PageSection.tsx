import type { ReactNode } from "react"

interface PageSectionProps {
  title: string
  subtitle?: string
  buttons?: ReactNode
  buttonPosition?: "right" | "center"
  children?: ReactNode
}

export default function PageSection({
  title,
  subtitle,
  buttons,
  buttonPosition = "right",
  children,
}: PageSectionProps) {
  return (
    <div className="bg-muted min-h-full overflow-hidden rounded-lg">
      {/* Header */}
      <div
        className={[
          "bg-card border-border border-b px-4 py-4 sm:px-6",
          buttonPosition === "center"
            ? "flex flex-col items-center gap-3 text-center"
            : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        ].join(" ")}
      >
        {/* Title + subtitle */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p>
          )}
        </div>

        {/* Buttons */}
        {buttons && (
          <div
            className={[
              "flex flex-wrap gap-3",
              buttonPosition === "center"
                ? "justify-center"
                : "justify-start sm:justify-end",
            ].join(" ")}
          >
            {buttons}
          </div>
        )}
      </div>

      {/* Page body */}
      {children && <div className="p-4 sm:p-6">{children}</div>}
    </div>
  )
}
