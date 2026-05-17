import type { ClothingTypeSizeSummary } from "#/clothing/service/clothingOverviewQueries"
import ErrorState from "#/components/base/ErrorState"
import LabelWithCount from "#/components/base/LabelWithCount"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RenderIf from "#/components/base/RenderIf"
import { Badge } from "#/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
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
    <Card id="clothing-management-content">
      <CardHeader>
        <CardTitle>Bestandsuebersicht nach Groesse</CardTitle>
        <CardDescription>
          Anzahl der Kleidungsstuecke pro Kleidungstyp und Groesse.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <RenderIf when={isLoading}>
          <LoadingIndicator label="Uebersicht wird geladen..." />
        </RenderIf>

        <RenderIf when={isError}>
          <ErrorState message="Bestandsuebersicht konnte nicht geladen werden." />
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
      </CardContent>
    </Card>
  )
}

function renderClothingTypeSummary(
  clothingTypeSummary: ClothingTypeSizeSummary,
) {
  return clothingTypeSummary.sizeGroupSummary.map((sizeGroup, index) => (
    <TableRow key={`${clothingTypeSummary.typeId}-${sizeGroup.name}`}>
      <RenderIf when={index === 0}>
        <TableCell
          rowSpan={clothingTypeSummary.sizeGroupSummary.length}
          className="font-medium"
        >
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
            <Badge key={sizeSummary.size} variant="outline">
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
