import type { ClothingTypeSizeSummary } from "#/clothing/service/clothingOverviewQueries"
import ErrorState from "#/components/base/ErrorState"
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
                <TableHead>Groessen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryData.map((entry) => (
                <TableRow key={entry.typeId}>
                  <TableCell className="font-medium">
                    {entry.typeName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {[...entry.sizeCounts]
                        .sort((a, b) => a.size.localeCompare(b.size, "de"))
                        .map(({ size, count }) => (
                          <Badge
                            key={`${entry.typeId}-${size}`}
                            variant="outline"
                          >
                            {size}: {count}
                          </Badge>
                        ))}

                      {entry.sizeCounts.length === 0 && (
                        <span className="text-muted-foreground text-sm">
                          Keine Kleidungsstuecke vorhanden.
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
