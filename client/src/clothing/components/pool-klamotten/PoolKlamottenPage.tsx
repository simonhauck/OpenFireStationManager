import type { ClothingLocationSizeSummary } from "#/clothing/service/clothingOverviewQueries"
import { useClothingOverview } from "#/clothing/service/clothingOverviewQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RenderIf from "#/components/base/RenderIf"
import { Badge } from "#/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"

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
    <section className="space-y-8">
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
    </section>
  )
}

interface LocationSizeSummaryTableProps {
  summary: ClothingLocationSizeSummary
}

function LocationSizeSummaryTable({ summary }: LocationSizeSummaryTableProps) {
  const typeSummaries = [...summary.types].sort((a, b) =>
    a.typeName.localeCompare(b.typeName, "de"),
  )

  const totalCount = typeSummaries.reduce(
    (locationTotal, typeSummary) =>
      locationTotal +
      typeSummary.sizeCounts.reduce(
        (typeTotal, sizeSummary) => typeTotal + sizeSummary.count,
        0,
      ),
    0,
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {summary.locationName}
            </h2>
            <p className="text-muted-foreground text-sm">
              Verfuegbare Pool-Kleidung am Standort
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Gesamt
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 text-3xl font-bold">
              {totalCount}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <RenderIf when={typeSummaries.length > 0}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {typeSummaries.map((typeSummary) => (
              <Card
                key={`${summary.locationId}-${typeSummary.typeId}`}
                className="h-full"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">
                      {typeSummary.typeName}
                    </CardTitle>
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">
                      Summe{" "}
                      {typeSummary.sizeCounts.reduce(
                        (sum, entry) => sum + entry.count,
                        0,
                      )}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex min-h-16 flex-wrap gap-2">
                    {[...typeSummary.sizeCounts]
                      .sort((a, b) => a.size.localeCompare(b.size, "de"))
                      .map(({ size, count }) => (
                        <Badge
                          key={`${summary.locationId}-${typeSummary.typeId}-${size}`}
                          variant="outline"
                          className="gap-2 px-3 py-1.5 text-base"
                        >
                          <span>{size}:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {count}
                          </span>
                        </Badge>
                      ))}

                    <RenderIf when={typeSummary.sizeCounts.length === 0}>
                      <span className="text-muted-foreground text-sm">
                        Keine Kleidungsstuecke vorhanden.
                      </span>
                    </RenderIf>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </RenderIf>

        <RenderIf when={typeSummaries.length === 0}>
          <p className="text-muted-foreground text-sm">
            Keine Kleidungstypen vorhanden.
          </p>
        </RenderIf>
      </CardContent>
    </Card>
  )
}
