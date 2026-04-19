import type { ClothingLocationSizeSummary } from "#/clothing/service/clothingOverviewQueries"
import { useClothingOverview } from "#/clothing/service/clothingOverviewQueries"
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

export default function PoolKlamottenPage() {
  const { data: overview, isLoading, isError } = useClothingOverview()

  return (
    <div className="space-y-6">
      <PoolKlamottenOverviewCard
        overview={overview}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  )
}

interface PoolKlamottenOverviewCardProps {
  overview: ClothingLocationSizeSummary[] | undefined
  isLoading: boolean
  isError: boolean
}

function PoolKlamottenOverviewCard({
  overview,
  isLoading,
  isError,
}: PoolKlamottenOverviewCardProps) {
  const overviewData = overview ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pool Klamotten</CardTitle>
        <CardDescription>
          Anzahl der verfuegbaren Kleidungsstuecke pro Standort und Groesse.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <RenderIf when={isLoading}>
          <LoadingIndicator label="Uebersicht wird geladen..." />
        </RenderIf>

        <RenderIf when={isError}>
          <ErrorState message="Uebersicht konnte nicht geladen werden." />
        </RenderIf>

        <RenderIf when={!isLoading && !isError && overviewData.length === 0}>
          <p className="text-muted-foreground text-sm">
            Es sind keine Standorte fuer die Anzeige konfiguriert.
          </p>
        </RenderIf>

        <RenderIf when={overviewData.length > 0}>
          {overviewData.map((locationSummary) => (
            <LocationSizeSummaryTable
              key={locationSummary.locationId}
              summary={locationSummary}
            />
          ))}
        </RenderIf>
      </CardContent>
    </Card>
  )
}

interface LocationSizeSummaryTableProps {
  summary: ClothingLocationSizeSummary
}

function LocationSizeSummaryTable({ summary }: LocationSizeSummaryTableProps) {
  const typeSummaries = [...summary.types].sort((a, b) =>
    a.typeName.localeCompare(b.typeName, "de"),
  )

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{summary.locationName}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kleidungstyp</TableHead>
            <TableHead>Groessen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {typeSummaries.map((typeSummary) => (
            <TableRow key={`${summary.locationId}-${typeSummary.typeId}`}>
              <TableCell className="font-medium">{typeSummary.typeName}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {[...typeSummary.sizeCounts]
                    .sort((a, b) => a.size.localeCompare(b.size, "de"))
                    .map(({ size, count }) => (
                      <Badge
                        key={`${summary.locationId}-${typeSummary.typeId}-${size}`}
                        variant="outline"
                      >
                        {size}: {count}
                      </Badge>
                    ))}

                  <RenderIf when={typeSummary.sizeCounts.length === 0}>
                    <span className="text-muted-foreground text-sm">
                      Keine Kleidungsstuecke vorhanden.
                    </span>
                  </RenderIf>
                </div>
              </TableCell>
            </TableRow>
          ))}

          <RenderIf when={typeSummaries.length === 0}>
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground text-sm">
                Keine Kleidungstypen vorhanden.
              </TableCell>
            </TableRow>
          </RenderIf>
        </TableBody>
      </Table>
    </div>
  )
}
