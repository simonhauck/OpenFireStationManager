import { Heading } from "@astryxdesign/core/Heading"
import { Section } from "@astryxdesign/core/Section"
import { Text } from "@astryxdesign/core/Text"
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
    <Section
      variant="transparent"
      padding={0}
      data-testid={`section-${title}`}
      className="border-border pb-6 last:pb-0 [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-6"
    >
      {/* Header */}
      <div className="border-border mb-4 flex flex-wrap items-start justify-between gap-3 border-b pb-3">
        <div>
          <Heading level={2}>{title}</Heading>
          {subtitle && (
            <Text type="supporting" as="p" className="mt-0.5">
              {subtitle}
            </Text>
          )}
        </div>

        {right && <div className="flex items-center">{right}</div>}
      </div>

      {/* Body */}
      {children}
    </Section>
  )
}
