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
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{summary.locationName}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Groessen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.sizeCounts)
                  .sort(([sizeA], [sizeB]) => sizeA.localeCompare(sizeB, "de"))
                  .map(([size, count]) => (
                    <Badge
                      key={`${summary.locationId}-${size}`}
                      variant="outline"
                    >
                      {size}: {Number(count)}
                    </Badge>
                  ))}

                <RenderIf when={Object.keys(summary.sizeCounts).length === 0}>
                  <span className="text-muted-foreground text-sm">
                    Keine Kleidungsstuecke vorhanden.
                  </span>
                </RenderIf>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
