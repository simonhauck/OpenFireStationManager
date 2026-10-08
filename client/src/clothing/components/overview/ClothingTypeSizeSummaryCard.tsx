import { Badge } from "@astryxdesign/core/Badge"
import {
  pixel,
  proportional,
  Table,
  type TableColumn,
} from "@astryxdesign/core/Table"
import { Text } from "@astryxdesign/core/Text"

import type {
  ClothingTypeSizeSummary,
  SizeGroupSummary,
} from "#/clothing/model/overview.ts"
import ErrorState from "#/components/base/ErrorState"
import LabelWithCount from "#/components/base/LabelWithCount"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"

interface ClothingTypeSizeSummaryCardProps {
  summary: ClothingTypeSizeSummary[] | undefined
  isLoading: boolean
  isError: boolean
}

export default function ClothingTypeSizeSummaryCard({
  summary,
  isLoading,
  isError,
}: ClothingTypeSizeSummaryCardProps) {
  const summaryData = summary ?? []

  return (
    <>
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Übersicht wird geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Bestandsübersicht konnte nicht geladen werden." />
      </RenderIf>

      <RenderIf when={summary !== undefined && summaryData.length === 0}>
        <Text type="supporting" as="p">
          Es sind noch keine Kleidungstypen vorhanden.
        </Text>
      </RenderIf>

      {summaryData.map((typeSummary) => (
        <ClothingTypeSection key={typeSummary.typeId} summary={typeSummary} />
      ))}
    </>
  )
}

interface ClothingTypeSectionProps {
  summary: ClothingTypeSizeSummary
}

function ClothingTypeSection({ summary }: ClothingTypeSectionProps) {
  const columns: TableColumn<SizeGroupSummary>[] = [
    {
      key: "name",
      header: "Größe",
      width: pixel(140),
      renderCell: (sizeGroup) => (
        <LabelWithCount
          label={sizeGroup.name}
          count={sizeGroup.totalCount}
          format="braces"
        />
      ),
    },
    {
      key: "availability",
      header: "Verfügbarkeit",
      width: proportional(1),
      renderCell: (sizeGroup) => (
        <div className="flex flex-wrap gap-2">
          {sizeGroup.sizes.map((sizeSummary) => (
            <Badge
              key={sizeSummary.size}
              variant="neutral"
              className="size-chip"
              label={
                <LabelWithCount
                  label={sizeSummary.size}
                  count={sizeSummary.count}
                  format="colon"
                />
              }
            />
          ))}
        </div>
      ),
    },
  ]

  return (
    <PageSubSection
      title={summary.typeName}
      right={
        <div className="text-right">
          <Text as="p" type="supporting" className="uppercase tracking-wide">
            Gesamt
          </Text>
          <Text as="p" size="2xl" weight="bold" className="text-success">
            {summary.totalCount}
          </Text>
        </div>
      }
    >
      <Table
        density="spacious"
        className="overview-table"
        data={[...summary.sizeGroupSummary]}
        columns={columns}
        idKey="name"
      />
    </PageSubSection>
  )
}
