import { Heading } from "@astryxdesign/core/Heading"
import { Section } from "@astryxdesign/core/Section"
import { Text } from "@astryxdesign/core/Text"
import type { ReactNode } from "react"

interface PageSectionProps {
  title: string
  subtitle?: string
  buttons?: ReactNode
  buttonPosition?: "right" | "center"
  className?: string
  children?: ReactNode
}

export default function PageSection({
  title,
  subtitle,
  buttons,
  buttonPosition = "right",
  className,
  children,
}: PageSectionProps) {
  return (
    <Section
      variant="muted"
      padding={0}
      className={["min-h-full overflow-hidden", className].join(" ")}
    >
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
          <Heading level={1}>{title}</Heading>
          {subtitle && (
            <Text type="supporting" as="p" className="mt-0.5">
              {subtitle}
            </Text>
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
    </Section>
  )
}
