import type { ClothingTypeSizeSummary } from "#/clothing/model/overview.ts"
import ErrorState from "#/components/base/ErrorState"
import LabelWithCount from "#/components/base/LabelWithCount"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"
import { Badge } from "#/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table"

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
    <PageSubSection title="Bestandsübersicht nach Größe">
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Übersicht wird geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Bestandsübersicht konnte nicht geladen werden." />
      </RenderIf>

      <RenderIf when={summaryData.length > 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kleidungstyp</TableHead>
              <TableHead>Größe</TableHead>
              <TableHead>Verfügbarkeit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryData.flatMap((clothingTypeSummary) =>
              renderClothingTypeSummary(clothingTypeSummary),
            )}
          </TableBody>
        </Table>
      </RenderIf>

      <RenderIf when={summary !== undefined && summaryData.length === 0}>
        <p className="text-muted-foreground text-sm">
          Es sind noch keine Kleidungstypen vorhanden.
        </p>
      </RenderIf>
    </PageSubSection>
  )
}

function renderClothingTypeSummary(
  clothingTypeSummary: ClothingTypeSizeSummary,
) {
  return clothingTypeSummary.sizeGroupSummary.map((sizeGroup, index) => (
    <TableRow key={`${clothingTypeSummary.typeId}-${sizeGroup.name}`}>
      <RenderIf when={index === 0}>
        <TableCell rowSpan={clothingTypeSummary.sizeGroupSummary.length}>
          <LabelWithCount
            label={clothingTypeSummary.typeName}
            count={clothingTypeSummary.totalCount}
            format="braces"
          />
        </TableCell>
      </RenderIf>

      <TableCell>
        <LabelWithCount
          label={sizeGroup.name}
          count={sizeGroup.totalCount}
          format="braces"
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {sizeGroup.sizes.map((sizeSummary) => (
            <Badge key={sizeSummary.size} variant="outline" className="text-sm">
              <LabelWithCount
                label={sizeSummary.size}
                count={sizeSummary.count}
                format="colon"
              />
            </Badge>
          ))}
        </div>
      </TableCell>
    </TableRow>
  ))
}
