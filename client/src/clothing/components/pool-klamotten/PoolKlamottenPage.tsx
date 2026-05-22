import { Link } from "@tanstack/react-router"

import type {
  ClothingLocationSizeSummary,
  ClothingTypeSizeSummary,
} from "#/clothing/service/clothingOverviewQueries"
import { useClothingOverview } from "#/clothing/service/clothingOverviewQueries"
import { TouchButton } from "#/clothing/checkout/components/TouchComponents"
import ErrorState from "#/components/base/ErrorState"
import LabelWithCount from "#/components/base/LabelWithCount"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import { Badge } from "#/components/ui/badge"
import RoleGuard from "#/components/base/RoleGuard.tsx"

export default function PoolKlamottenPage() {
  const { data: overview, isLoading, isError } = useClothingOverview()

  return (
    <PageSection
      title="Pool Klamotten"
      buttonPosition="right"
      buttons={
        <>
          <RoleGuard allowedRoles={["KLEIDERWART"]} hideChildComponent={true}>
            <TouchButton asChild variant="outline">
              <Link to="/pool-clothing/relocation">Umlagerung starten</Link>
            </TouchButton>
          </RoleGuard>
          <TouchButton asChild>
            <Link to="/pool-clothing/checkout">Klamotten Ausgabe</Link>
          </TouchButton>
        </>
      }
    >
      <PoolKlamottenOverviewCard
        overview={overview}
        isLoading={isLoading}
        isError={isError}
      />
    </PageSection>
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
    <section className="space-y-6">
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
        <div className="divide-border divide-y">
          {overviewData.map((locationSummary) => (
            <div
              key={locationSummary.locationId}
              className="py-6 first:pt-0 last:pb-0"
            >
              <LocationSizeSummaryTable summary={locationSummary} />
            </div>
          ))}
        </div>
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
    (locationTotal, typeSummary) => locationTotal + typeSummary.totalCount,
    0,
  )

  return (
    <div className="space-y-6">
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

      <div>
        <RenderIf when={typeSummaries.length > 0}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {typeSummaries.map((typeSummary) => (
              <TypeAvailabilityPanel
                key={`${summary.locationId}-${typeSummary.typeId}`}
                locationId={summary.locationId}
                typeSummary={typeSummary}
              />
            ))}
          </div>
        </RenderIf>

        <RenderIf when={typeSummaries.length === 0}>
          <p className="text-muted-foreground text-sm">
            Keine Kleidungstypen vorhanden.
          </p>
        </RenderIf>
      </div>
    </div>
  )
}

interface TypeAvailabilityPanelProps {
  locationId: ClothingLocationSizeSummary["locationId"]
  typeSummary: ClothingTypeSizeSummary
}

function TypeAvailabilityPanel({
  locationId,
  typeSummary,
}: TypeAvailabilityPanelProps) {
  const sizeGroups = [...typeSummary.sizeGroupSummary].map(
    (sizeGroupSummary) => ({
      ...sizeGroupSummary,
      sizes: [...sizeGroupSummary.sizes].sort((a, b) =>
        a.size.localeCompare(b.size, "de"),
      ),
    }),
  )

  const groupNameColumnWidthCh = sizeGroups.reduce(
    (maxLength, sizeGroup) => Math.max(maxLength, sizeGroup.name.length),
    0,
  )

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="bg-muted/40 border-b px-3 py-2">
        <p className="text-base font-semibold">
          <LabelWithCount
            label={typeSummary.typeName}
            count={typeSummary.totalCount}
            format="braces"
          />
        </p>
      </div>

      <div className="p-3">
        <RenderIf
          when={sizeGroups.some((sizeGroup) => sizeGroup.sizes.length > 0)}
        >
          <div className="divide-y">
            {sizeGroups.map((sizeGroupSummary) => (
              <div
                key={`${locationId}-${typeSummary.typeId}-${sizeGroupSummary.name}`}
                className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
              >
                <span
                  className="text-muted-foreground shrink-0 text-xs font-medium uppercase tracking-wide"
                  style={{ width: `${groupNameColumnWidthCh}ch` }}
                >
                  {sizeGroupSummary.name}
                </span>
                <div className="flex flex-wrap gap-1">
                  {sizeGroupSummary.sizes.map((sizeSummary) => (
                    <Badge
                      key={`${locationId}-${typeSummary.typeId}-${sizeGroupSummary.name}-${sizeSummary.size}`}
                      variant="outline"
                      className="gap-2 px-3 py-1.5 text-base"
                    >
                      <LabelWithCount
                        label={sizeSummary.size}
                        count={sizeSummary.count}
                        format="colon"
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RenderIf>

        <RenderIf
          when={!sizeGroups.some((sizeGroup) => sizeGroup.sizes.length > 0)}
        >
          <span className="text-muted-foreground text-sm">
            Keine Kleidungsstuecke vorhanden.
          </span>
        </RenderIf>
      </div>
    </div>
  )
}
